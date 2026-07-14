export interface Logger {
  debug(message: string, metadata?: unknown): void;
  info(message: string, metadata?: unknown): void;
  warn(message: string, metadata?: unknown): void;
  error(message: string, metadata?: unknown): void;
}

export const logger: Logger = {
  debug: (message, metadata) => __DEV__ && console.debug(message, metadata),
  info: (message, metadata) => __DEV__ && console.info(message, metadata),
  warn: (message, metadata) => __DEV__ && console.warn(message, metadata),
  error: (message, metadata) => __DEV__ && console.error(message, metadata),
};
