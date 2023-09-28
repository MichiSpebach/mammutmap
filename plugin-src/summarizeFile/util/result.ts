export class Result<T>{
    public static of<T>(value: T): Result<T> {
        return new Result({ value: value, error: '', isPresent: true });
    }
    public static empty<T>(error: string): Result<T> {
        return new Result<T>({ isPresent: false, error: error, value: null });
    }
    private constructor(private value: { value: T | null, isPresent: boolean, error: string }) { }

    public get(): T {
        if (!this.isPresent()) {
            throw new Error("Optional is empty");
        }
        return this.value.value!;
    }

    public getError(): string {
        return this.value.error;
    }
    public isPresent(): boolean {
        return this.value.isPresent;
    }
    public map<U>(f: (t: T) => U): Result<U> {
        if (this.isPresent()) {
            return new Result({ value: f(this.value.value!), isPresent: true, error: '' });
        }
        return new Result<U>({ value: null, isPresent: false, error: this.value.error });
    }
}