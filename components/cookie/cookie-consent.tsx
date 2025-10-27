"use client"
import { useSearchParams } from "next/navigation"
import * as CookieConsent from "vanilla-cookieconsent"
import pluginConfig from "./cookie-consent-config"

import { useEffectOnce } from "react-use"
import "vanilla-cookieconsent/dist/cookieconsent.css"

const CookieConsentComponent = () => {
  const searchParams = useSearchParams()

  const updatedConfig = {
    ...pluginConfig,
    ...{
      language: {
        default: "en",

        translations: pluginConfig.language.translations,
      },
    },
  }

  useEffectOnce(() => {
    if (searchParams.get("noCookieConsent")) {
      CookieConsent.hide()
    } else {
      CookieConsent.run(updatedConfig)
    }
  })

  return <></>
}

export default CookieConsentComponent
