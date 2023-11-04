import { logger } from '@/logging/logger';
import { countAndUpdateWords } from '@/metrics';
import axios, { AxiosInstance } from 'axios';
import { environment } from "../env/environment";

export interface TranslationResponse {
    detectedLanguage?: string;
    text: string;
}

export class TranslatorClient {

    private instance: AxiosInstance;

    constructor() {
        this.instance = axios.create({
            baseURL: environment.translator.endpoint,
            timeout: 3000,
            headers: {
                "Ocp-Apim-Subscription-Key": environment.translator.apiKey,
                "Ocp-Apim-Subscription-Region": environment.translator.region,
                "Content-Type": "application/json"
            }
        });
    }

    async detectLanguage(text: string): Promise<string> {
        let response = await this.instance.post("detect?api-version=3.0", [{'Text': text}])
        if (response.status == 200) {
            logger.debug("Translator Response: %O", response.data);
            return response.data[0].language;
        }
        logger.error(response);
        throw Error(response.statusText);
    }

    async translate(text: string, toLanguage: string, fromLanguage?: string): Promise<TranslationResponse> {
        countAndUpdateWords(text);
        let apiUrl = `translate?api-version=3.0&to=${toLanguage}`;
        if (fromLanguage) apiUrl = apiUrl.concat(`&from=${fromLanguage}`)
        let response = await this.instance.post(apiUrl, [{'Text': text}]);
        if (response.status == 200) {
            let data = response.data[0];
            logger.debug("Translator Response: %O", data);
            return {
                detectedLanguage: data.detectedLanguage != undefined ? data.detectedLanguage.language : fromLanguage,
                text: data.translations[0].text
            }
        }
        logger.error(response);
        throw Error(response.statusText);
    }
}