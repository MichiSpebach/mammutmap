
import { Result } from "./result";

describe("Result", () => {
    it('returns the value if present', () => {
        const underTest = Result.of(42);
        expect(underTest.get()).toEqual(42);
    });
    it('throws an error if value is not present', () => {
        const underTest = Result.empty('error');
        expect(() => underTest.get()).toThrowError('Optional is empty');
    });
    [{ input: Result.of(42), isPresent: true }, { input: Result.empty('error'), isPresent: false }].forEach((underTest) => {
        it('shows if value is present in' + underTest.input, () => {
            expect(underTest.input.isPresent()).toEqual(underTest.isPresent);
        })
    });
    it('maps the value if present : case is present', () => {
        const underTest = Result.of(42);
        expect(underTest.map((v) => v + 1).get()).toEqual(43);
    });
    it('maps the value if present : case is not present', () => {
        const underTest = Result.empty<number>('error');
        expect(underTest.map((v) => v + 1).isPresent()).toEqual(false);
    });
    it('returns error if value is not present', () => {
        const valuePresent = Result.of(42);
        const valueNotPresent = Result.empty<number>('error');
        expect(valuePresent.getError()).toEqual('');
        expect(valueNotPresent.getError()).toEqual('error');
    });
});