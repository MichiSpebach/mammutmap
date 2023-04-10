
export class NotFoundError extends Error {

  public override readonly name: string = 'NotFoundError';

  public constructor(message: string) {
    super(message);
  }
}
