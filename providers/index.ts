import { GhasedakSMSProvider } from "./ghasedak";
import { AbstractSMSProvider } from "./provider";

import _ from 'lodash';

export const providers = {
	ghasedak: new GhasedakSMSProvider(),
};

export type TProviders = typeof providers;

export const providerOf = (provider: keyof TProviders): AbstractSMSProvider => {
	return providers[provider];
};

export const providerExists = (provider: keyof TProviders): boolean => {
	return _.has(providers, provider);
};
