
export class NotImplementedError extends Error {

  public override readonly name: string = 'NotImplementedError';

  public constructor(message: string) {
    super(message);
  }
}
