import {
	AbstractSMSProvider,
	ISMSProviderResponse,
	ISMSProviderSendMessageData,
	ISMSProviderSendOTPData,
} from "./provider";

import axios from "axios";
import _ from "lodash";

export class GhasedakSMSProvider extends AbstractSMSProvider {
	private endpoint = "https://api.ghasedak.me/v2";

	async sendMessage(
		data: ISMSProviderSendMessageData
	): Promise<ISMSProviderResponse> {
		try {
			const body = {
				message: data.data.message,
				receptor: data.data.receptor.replace("+98", ""),
				linenumber: data.config.lineNumber,
			};

			const result = await axios.post(
				this.endpoint + "/sms/send/simple",
				_.join(
					_.map(body, (v, k) => `${k}=${v}`),
					"&"
				),
				{
					headers: {
						"cache-control": "no-cache",
						"content-type": "application/x-www-form-urlencoded",
						apikey: data.config.accessToken,
					},
				}
			);

			const statusCode = result.status;

			return this.genereateResponse(statusCode, result.data);
		} catch (error) {
			// if error is axios response
			if (error.response) {
				return this.genereateResponse(
					error.response.status,
					error.response.data
				);
			}

			return {
				status: false,
				code: "EXCEPTION",
			};
		}
	}

	async sendOTP(data: ISMSProviderSendOTPData): Promise<ISMSProviderResponse> {
		try {
			const body = {
				template: data.data.template,
				receptor: data.data.receptor.replace("+98", ""),
				type: data.data.method == "sms" ? 1 : 2,
				...data.data.params,
			};

			const result = await axios.post(
				this.endpoint + "/verification/send/simple",
				_.join(
					_.map(body, (v, k) => `${k}=${v}`),
					"&"
				),
				{
					headers: {
						"cache-control": "no-cache",
						"content-type": "application/x-www-form-urlencoded",
						apikey: data.config.accessToken,
					},
				}
			);

			const statusCode = result.status;

			return this.genereateResponse(statusCode, result.data);
		} catch (error) {
			// if error is axios response
			if (error.response) {
				return this.genereateResponse(
					error.response.status,
					error.response.data
				);
			}

			console.error(error);

			return {
				status: false,
				code: "EXCEPTION",
			};
		}
	}

	private genereateResponse(statusCode = 0, data: any): ISMSProviderResponse {
		if (data.items && Array.isArray(data.items)) {
			// 8 == RECEPTOR
			if (data.items.includes(8)) {
				return {
					status: false,
					code: "RECEPTOR",
				};
			}

			// 11 == IP
			if (data.items.includes(11)) {
				return {
					status: false,
					code: "IP",
				};
			}
		}

		switch (statusCode) {
			case 200:
				return {
					status: true,
					code: "SUCCESSFULL",
					id: data.items[0],
				};
				break;
			case 400:
				return {
					status: false,
					code: "BADDATA",
				};
				break;
			case 401:
			case 403:
				return {
					status: false,
					code: "FORBIDDEN",
				};
				break;
			default:
				return {
					status: false,
					code: "UNKNWON",
					message: data.result.message,
				};
				break;
		}
	}
}
