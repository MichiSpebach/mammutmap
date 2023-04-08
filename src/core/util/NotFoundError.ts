
export class NotFoundError extends Error {

  public readonly name: string = 'NotFoundError';

  public constructor(message: string) {
    super(message);
  }
}
