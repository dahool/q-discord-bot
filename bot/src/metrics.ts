import io from '@pm2/io'
import { DateTime } from 'luxon'
import mongoose, { Document, Schema } from 'mongoose'
import { logger } from './logging/logger'

interface Metrics extends Document {
    translatedWords: number,
    translatedChars: number
}

interface MetricsMontly extends Document {
    month: string,
    translatedWords: number,
    translatedChars: number
}

const MetricsSchema = new Schema<Metrics>({
    translatedWords: Number,
    translatedChars: Number
}, { collection: 'bot_metrics'})

const MetricsMontlySchema = new Schema<MetricsMontly>({
    month: String,
    translatedWords: Number,
    translatedChars: Number
}, { collection: 'bot_metrics_month'})

export const MetricsModel = mongoose.model<Metrics>('MetricsModel', MetricsSchema);
export const MetricsMontlyModel = mongoose.model<MetricsMontly>('MetricsMontlyModel', MetricsMontlySchema);

const translationMetrics = {
    total: io.metric({
        name: 'Total translated words'
    }),
    totalMonth: io.metric({
        name: 'Total translated words (month)',
    }),
    totalSession: io.metric({
        name: 'Total translated words (session)'
    }),
    totalChars: io.metric({
        name: 'Total translated characters'
    }),
    totalMonthChars: io.metric({
        name: 'Total translated characters (month)',
    }),
}


translationMetrics.total.set(0);
translationMetrics.totalMonth.set(0);
translationMetrics.totalSession.set(0);
translationMetrics.totalChars.set(0);
translationMetrics.totalMonthChars.set(0);

function getCurrentMonth(): string {
    const today = DateTime.utc();
    return today.toFormat('yyyyMM');
}

function countWords(s: string): number {
    const re = new RegExp(
        `[^a-z0-9A-Z_äöüßÀÁÂĂÂÃÈÉÊÌÎÍÒÓÔÕȘȚÙÚĂĐĨŨƠàáăââãèéêîìíòóôõùúășțđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềếềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹçñ]+`
      , "igm"
    )
    return s.split(re).filter(Boolean).length;
};

export async function countAndUpdateWords(s: string) {
    updateTranslationMetrics(countWords(s), s.length);
}

export async function updateTranslationMetrics(numberWords: number, characters: number) {
    let metrics = await MetricsModel.findOne().exec();
    if (metrics == undefined) {
        metrics = await MetricsModel.create({
            translatedWords: 0,
            translatedChars: 0
        })
    }
    metrics.translatedWords += numberWords;
    if (metrics.translatedChars == undefined) {
        metrics.translatedChars = 0;
    }
    metrics.translatedChars += characters;
    metrics.save();
    let monthMetrics = await MetricsMontlyModel.findOne({month: getCurrentMonth()}).exec();
    if (monthMetrics == undefined) {
        monthMetrics = await MetricsMontlyModel.create({
            month: getCurrentMonth(),
            translatedWords: 0,
            translatedChars: 0
        })
    }
    monthMetrics.translatedWords += numberWords;
    monthMetrics.translatedChars += characters;
    monthMetrics.save();
    logger.debug("Translated %d words", numberWords);
    translationMetrics.total.set(metrics.translatedWords);
    translationMetrics.totalMonth.set(monthMetrics.translatedWords);
    translationMetrics.totalSession.set(translationMetrics.totalSession.val() + numberWords);
    translationMetrics.totalChars.set(metrics.translatedChars);
    translationMetrics.totalMonthChars.set(monthMetrics.translatedChars);
}
