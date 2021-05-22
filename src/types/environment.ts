export enum EnvName {
  development="development",
  staging="staging",
  production="production",
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: EnvName;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}