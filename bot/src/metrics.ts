import io from '@pm2/io'
import { DateTime } from 'luxon'
import mongoose, { Document, Schema } from 'mongoose'
import { logger } from './logging/logger'

interface Metrics extends Document {
    translatedWords: number
}

interface MetricsMontly extends Document {
    month: string,
    translatedWords: number
}

const MetricsSchema = new Schema<Metrics>({
    translatedWords: Number
}, { collection: 'bot_metrics'})

const MetricsMontlySchema = new Schema<MetricsMontly>({
    month: String,
    translatedWords: Number
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
    })    
}

translationMetrics.total.set(0);
translationMetrics.totalMonth.set(0);
translationMetrics.totalSession.set(0);

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
    updateTranslationMetrics(countWords(s));
}

export async function updateTranslationMetrics(numberWords: number) {
    let metrics = await MetricsModel.findOne().exec();
    if (metrics == undefined) {
        metrics = await MetricsModel.create({
            translatedWords: numberWords
        })
    } else {
        metrics.translatedWords += numberWords;
        metrics.save();
    }
    let monthMetrics = await MetricsMontlyModel.findOne({month: getCurrentMonth()}).exec();
    if (monthMetrics == undefined) {
        monthMetrics = await MetricsMontlyModel.create({
            month: getCurrentMonth(),
            translatedWords: 0
        })
    } else {
        monthMetrics.translatedWords += numberWords;
        monthMetrics.save();
    }
    logger.debug("Translated %d words", numberWords);
    translationMetrics.total.set(metrics.translatedWords);
    translationMetrics.totalMonth.set(monthMetrics.translatedWords);
    translationMetrics.totalSession.set(translationMetrics.totalSession.val() + numberWords);
}
