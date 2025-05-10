declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MISSKEY_API_URL: string
      MISSKEY_API_KEY: string
    }
  }
}

export {}
