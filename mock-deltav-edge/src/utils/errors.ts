export class MockHttpError extends Error {
  readonly statusCode: number;
  readonly payload?: unknown;

  constructor(statusCode: number, message: string, payload?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.payload = payload;
  }
}
