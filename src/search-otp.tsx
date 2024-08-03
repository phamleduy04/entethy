import { Detail, LocalStorage } from "@raycast/api"
import { createContext, useContext, useEffect, useReducer, useState } from "react"
import { addToCache, APPS_KEY, checkIfCached, getFromCache, OTP_SERVICES_KEY, SERVICES_KEY } from "./cache"
import { AppEntry, AppsResponse, AuthenticatorToken, ServicesResponse } from "./client/dto"
import { login, logout, removeCachedValuesIfEnteEmailHasBeenChanged, Service } from "./component/login/login-helper"
import { checkAtLeastOneValidOtp } from "./component/otp/otp-helpers"
import { OtpList } from "./component/otp/OtpList"
import { mapOtpServices } from "./util/utils"

interface IOtpList {
  services: Service[]
  isLoading: boolean
}

interface EnteContextType {
  isLoggedIn: boolean
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>
  otpList: IOtpList
  setOtpList: React.Dispatch<React.SetStateAction<IOtpList>>
}

export const EnteContext = createContext<EnteContextType | undefined>(undefined)

export function useEnteContext() {
  const context = useContext(EnteContext)
  if (context === undefined) throw new Error("useEnteContext must be used within an EnteContext")
  return context
}

const appReducer = (state: string, action: any) => {
  switch (action.type) {
    case EMAIL_CHECK_SUCCESS:
      return CACHE_CHECK
    case CACHE_CHECK_SUCCESS:
      return READY
    default:
      return state
  }
}
const EMAIL_CHECK = "email-check"
const CACHE_CHECK = "cache-check"
const READY = "ready"
const ALLOWED_RENDERING_STATES = [READY]

const EMAIL_CHECK_SUCCESS = "email-check-success"
const CACHE_CHECK_SUCCESS = "cache-check-success"

LocalStorage.clear()

export default function SearchOtp() {
  const [appState, dispatch] = useReducer(appReducer, EMAIL_CHECK)
  const [otpList, setOtpList] = useState<IOtpList>({ services: [], isLoading: true })
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)

  useEffect(() => {
    const checkEmailUnchanged = async () => {
      if (appState !== EMAIL_CHECK) return

      console.log("checkEmailUnchanged")
      const isEnteEmailChanged = await removeCachedValuesIfEnteEmailHasBeenChanged(setIsLoggedIn)
      if (isEnteEmailChanged) {
        console.log("checkEmailUnchanged: isEnteEmailChanged logout()")
        logout()
        return
      }
      console.log("checkEmailUnchanged: dispatch({ type: EMAIL_CHECK_SUCCESS })")
      dispatch({ type: EMAIL_CHECK_SUCCESS })
    }
    checkEmailUnchanged()
  }, [appState])

  useEffect(() => {
    const checkDataInCache = async () => {
      if (appState !== CACHE_CHECK) return

      console.log("checkDataInCache")
      if (await checkIfCached(OTP_SERVICES_KEY)) {
        console.log("checkDataInCache: dispatch({ type: CACHE_CHECK_SUCCESS })")
        dispatch({ type: CACHE_CHECK_SUCCESS })
        return
      }

      // TODO: migration to single unified representation of otp service. Delete on the next release
      const services: AuthenticatorToken[] = []
      const apps: AppEntry[] = []

      let isDataPresent = false
      console.log("checkDataInCache: checkIfCached(SERVICES_KEY)")
      if (await checkIfCached(SERVICES_KEY)) {
        const serviceResponse: ServicesResponse = await getFromCache(SERVICES_KEY)
        services.push(...serviceResponse.authenticator_tokens)
        isDataPresent = true
      }

      console.log("checkDataInCache: checkIfCached(APPS_KEY)")
      if (await checkIfCached(APPS_KEY)) {
        const appsResponse: AppsResponse = await getFromCache(APPS_KEY)
        apps.push(...appsResponse.apps)
        isDataPresent = true
      }

      console.log("checkDataInCache: isDataPresent", isDataPresent)
      if (isDataPresent) {
        const otpServices = mapOtpServices(services, apps)
        await addToCache(OTP_SERVICES_KEY, otpServices)
      }
      // setIsLoggedIn(isDataPresent)

      console.log("checkDataInCache: otpList.services?.length", otpList.services?.length)
      if (otpList.services?.length > 0) await checkAtLeastOneValidOtp(otpList.services)
      if (!isDataPresent) {
        console.log("checkDataInCache: !isDataPresent login()")
        await login(setOtpList)
      } else {
        console.log("checkDataInCache: isDataPresent dispatch({ type: CACHE_CHECK_SUCCESS })")
        dispatch({ type: CACHE_CHECK_SUCCESS })
        return
      }
    }
    checkDataInCache()
  }, [appState])

  useEffect(() => {
    const loadDataFromCache = async () => {
      if (appState !== READY) return

      console.log("READY")

      // await loadData(setOtpList)
    }
    loadDataFromCache()
  }, [appState])

  if (!ALLOWED_RENDERING_STATES.includes(appState)) {
    return <Detail markdown="Fetching auth data..." actions={<></>} />
  }
  return (
    <EnteContext.Provider value={{ isLoggedIn, setIsLoggedIn, otpList, setOtpList }}>
      <OtpList />
    </EnteContext.Provider>
  )
}
