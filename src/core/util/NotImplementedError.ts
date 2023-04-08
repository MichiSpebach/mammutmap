
export class NotImplementedError extends Error {

  public readonly name: string = 'NotImplementedError';

  public constructor(message: string) {
    super(message);
  }
}
