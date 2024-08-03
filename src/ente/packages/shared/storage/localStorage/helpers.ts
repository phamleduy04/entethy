import { getData, LS_KEYS, setData } from ".";
import { getFromCache, USER } from "../../../../../cache";

export const getToken = async (): Promise<string> => {
    const token = await (await getFromCache(USER)).token // getData(LS_KEYS.USER)?.token;
    console.log("getToken: token", token)
    return token;
};

export const isFirstLogin = () =>
    getData(LS_KEYS.IS_FIRST_LOGIN)?.status ?? false;

export function setIsFirstLogin(status: boolean) {
    setData(LS_KEYS.IS_FIRST_LOGIN, { status });
}

export const justSignedUp = () =>
    getData(LS_KEYS.JUST_SIGNED_UP)?.status ?? false;

export function setJustSignedUp(status: boolean) {
    setData(LS_KEYS.JUST_SIGNED_UP, { status });
}

export function getLocalMapEnabled(): boolean {
    return getData(LS_KEYS.MAP_ENABLED)?.value ?? false;
}

export function setLocalMapEnabled(value: boolean) {
    setData(LS_KEYS.MAP_ENABLED, { value });
}

export function getLocalReferralSource() {
    return getData(LS_KEYS.REFERRAL_SOURCE)?.source;
}

export function setLocalReferralSource(source: string) {
    setData(LS_KEYS.REFERRAL_SOURCE, { source });
}
