import { ServiceSchema } from "../../../lib/types";

import _ from "lodash";

import { providerOf, providerExists } from "../providers";
import { ISMSProviderResponse } from "../providers/provider";

const Service: ServiceSchema = {
	name: "sms",
	version: "api.v1",

	/**
	 * Service settings
	 */
	settings: {},

	/**
	 * Service dependencies
	 */
	// dependencies: [],

	/**
	 * Actions
	 */
	actions: {
		send: {
			rest: "POST /send",
			params: {
				receptor: {
					type: "string",
					// pattern must starts with + and country code 1 or 2 or 3 digits and followed by 9-12 ditgits
					pattern: /^\+[1-9]{1,3}[0-9]{9,12}$/,
				},
				params: {
					type: "object",
					default: {},
					optional: true,
				},
				template: {
					type: "string",
					optional: true,
				},
				message: {
					type: "string",
					optional: true,
				},
				method: {
					type: "enum",
					values: ["sms", "call"],
					optional: true,
					default: "sms",
				},
			},
			async handler(ctx) {
				try {
					const { receptor, params, template, message, method } = ctx.params;
					const creator = ctx.meta.creator;

					// generate keys for configs
					let keys = ["SMS_CONFIG"];

					if (template) {
						keys.push(`SMS_CONFIG_TEMPLATE_${template}`);
					}

					// get configs from config service
					const configsResponse: any = await ctx.call(
						"api.v1.config.multiplex",
						{ keys }
					);

					// check if configs are valid
					if (configsResponse.code != 200) {
						return configsResponse;
					}

					// override configs
					let configs: any = {};

					for (let key of keys) {
						const config = configsResponse.data[key];

						if (config.exists == false) {
							return {
								code: 400,
								i18n: "CONFIG_NOT_FOUND",
								data: {
									key: config.key,
								},
							};
						}

						if (config.value && typeof config.value == "object") {
							configs = {
								...configs,
								...config.value,
							};
						}
					}

					// check if template is otp to use otp function
					const otp: boolean = configs["otp"] != undefined;

					let requiredKeyInConfigs = ["accessToken", "provider"];

					if (template) {
						requiredKeyInConfigs.push("template");
					}

                    if(!otp) {
                        // lineNumber required
                        requiredKeyInConfigs.push("lineNumber");
                    }

					// check if configs are valid with lodash
					for (let key of requiredKeyInConfigs) {
						if (!_.has(configs, key)) {
							return {
								code: 400,
								i18n: "NEED_KEY_IN_CONFIGS",
								data: {
									key: key,
								},
							};
						}
					}

					// check provider exists in providers
					if (!providerExists(configs.provider)) {
						return {
							code: 400,
							i18n: "PROVIDER_NOT_FOUND",
							data: {
								provider: configs.provider,
							},
						};
					}

					let input: any = {
						config: {
							accessToken: configs.accessToken,
							lineNumber: configs.lineNumber,
						},
						data: {
							method: method,
							receptor: receptor,
							params: params ?? {},
							message: message ?? undefined,
							template: configs.template ?? undefined,
						},
					};

					let result: ISMSProviderResponse | undefined = undefined;

					if (otp) {
						result = await providerOf(configs.provider).sendOTP(input);
					}

					if (!otp) {
						result = await providerOf(configs.provider).sendMessage(input);
					}

					if (result == undefined) {
						return {
							code: 500,
							i18n: "UNKNOWN_ERROR",
							data: {
								output: result,
								input,
							},
						};
					}

					if (result.status) {
						return {
							code: 200,
							i18n: "SMS_SENT",
							data: {
								output: result,
								input,
							},
						};
					} else {
						return {
							code: 400,
							i18n: "SMS_NOT_SENT",
							data: {
								output: result,
								input,
							},
						};
					}
				} catch (error) {
					return {
						code: 500,
					};
				}
			},
		},
	},

	/**
	 * Events
	 */
	events: {},

	/**
	 * Methods
	 */
	methods: {},

	/**
	 * Service created lifecycle event handler
	 */
	// created() {},

	/**
	 * Service started lifecycle event handler
	 */
	// started() { },

	/**
	 * Service stopped lifecycle event handler
	 */
	// stopped() { }
};

export = Service;
