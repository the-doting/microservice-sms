export abstract class AbstractSMSProvider {
	abstract sendMessage(
		data: ISMSProviderSendMessageData
	): Promise<ISMSProviderResponse>;

	abstract sendOTP(
		data: ISMSProviderSendOTPData
	): Promise<ISMSProviderResponse>;
}

export interface ISMSProviderConfig {
	accessToken: string;
	lineNumber?: string;
}

export interface ISMSProviderSendMessageData {
	config: ISMSProviderConfig;
	data: {
		receptor: string;
		message: string;
	};
}

export interface ISMSProviderSendOTPData {
	config: ISMSProviderConfig;
	data: {
		receptor: string;
		params: any;
		template: string;
		method: "sms" | "call";
	};
}

export interface ISMSProviderResponse {
	status: boolean;
	code:
		| "UNKNWON"
		| "SUCCESSFULL"
		| "BADDATA"
		| "FORBIDDEN"
		| "EXCEPTION"
		| "IP"
		| "RECEPTOR";
	id?: string; // message id for tracking
	message?: string;
}
