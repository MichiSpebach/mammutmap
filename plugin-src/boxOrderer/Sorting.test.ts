import { Box } from '../../dist/core/box/Box'
import { Sorting } from './Sorting'

test('enough space between items', () => {
	const sorting = new Sorting(0, 100, [
		{node: {} as Box, position: 10, size: 10},
		{node: {} as Box, position: 80, size: 10}
	])

	sorting.sort()

	expect(sorting.items).toEqual([
		{node: {} as Box, position: 10, size: 10},
		{node: {} as Box, position: 80, size: 10}
	])
})

test('enough space between items, with margin', () => {
	const sorting = new Sorting(0, 100, [
		{node: {} as Box, position: 10, size: 10},
		{node: {} as Box, position: 80, size: 10}
	], 4)

	sorting.sort()

	expect(sorting.items).toEqual([
		{node: {} as Box, position: 10, size: 10},
		{node: {} as Box, position: 80, size: 10}
	])
})

test('position too small', () => {
	const sorting = new Sorting(0, 100, [
		{node: {} as Box, position: -10, size: 20}
	])
	sorting.sort()
	expect(sorting.items).toEqual([
		{node: {} as Box, position: 0, size: 20}
	])
})

test('position too small, with margin', () => {
	const sorting = new Sorting(0, 100, [
		{node: {} as Box, position: -10, size: 20}
	], 4)
	sorting.sort()
	expect(sorting.items).toEqual([
		{node: {} as Box, position: 0, size: 20}
	])
})

test('position too big', () => {
	const sorting = new Sorting(0, 100, [
		{node: {} as Box, position: 90, size: 20}
	])
	sorting.sort()
	expect(sorting.items).toEqual([
		{node: {} as Box, position: 80, size: 20}
	])
})

test('position too big, with margin', () => {
	const sorting = new Sorting(0, 100, [
		{node: {} as Box, position: 90, size: 20}
	], 4)
	sorting.sort()
	expect(sorting.items).toEqual([
		{node: {} as Box, position: 80, size: 20}
	])
})

test('two items are overlapping', () => {
	const sorting = new Sorting(0, 100, [
		{node: {} as Box, position: 45, size: 20},
		{node: {} as Box, position: 55, size: 20}
	])

	sorting.sort()

	expect(sorting.items).toEqual([
		{node: {} as Box, position: 40, size: 20},
		{node: {} as Box, position: 60, size: 20}
	])
})

test('two items are overlapping, with margin', () => {
	const sorting = new Sorting(0, 100, [
		{node: {} as Box, position: 45, size: 20},
		{node: {} as Box, position: 55, size: 20}
	], 4)

	sorting.sort()

	expect(sorting.items).toEqual([
		{node: {} as Box, position: 38, size: 20},
		{node: {} as Box, position: 62, size: 20}
	])
})

test('5 items with overlappings', () => {
	const sorting = new Sorting(0, 100, [
		{node: {} as Box, position: 35, size: 10},
		{node: {} as Box, position: 40, size: 10},
		{node: {} as Box, position: 45, size: 10},
		{node: {} as Box, position: 50, size: 10},
		{node: {} as Box, position: 55, size: 10}
	])

	sorting.sort()

	expect(sorting.items).toEqual([
		{node: {} as Box, position: 25, size: 10},
		{node: {} as Box, position: 35, size: 10},
		{node: {} as Box, position: 45, size: 10},
		{node: {} as Box, position: 55, size: 10},
		{node: {} as Box, position: 65, size: 10}
	])
})

test('5 items with overlappings, with margin', () => {
	const sorting = new Sorting(0, 100, [
		{node: {} as Box, position: 35, size: 10},
		{node: {} as Box, position: 40, size: 10},
		{node: {} as Box, position: 45, size: 10},
		{node: {} as Box, position: 50, size: 10},
		{node: {} as Box, position: 55, size: 10}
	], 4)

	sorting.sort()

	expect(sorting.items).toEqual([
		{node: {} as Box, position: 17, size: 10},
		{node: {} as Box, position: 31, size: 10},
		{node: {} as Box, position: 45, size: 10},
		{node: {} as Box, position: 59, size: 10},
		{node: {} as Box, position: 73, size: 10}
	])
})

test('16 items with overlappings', () => {
	const sorting = new Sorting(0, 100, [
		{node: {} as Box, position: 10, size: 10},
		{node: {} as Box, position: 15, size: 10},
		{node: {} as Box, position: 20, size: 10},
		{node: {} as Box, position: 25, size: 10},
		{node: {} as Box, position: 30, size: 10},
		{node: {} as Box, position: 35, size: 10},
		{node: {} as Box, position: 40, size: 10},
		{node: {} as Box, position: 45, size: 10},
		{node: {} as Box, position: 50, size: 10},
		{node: {} as Box, position: 55, size: 10},
		{node: {} as Box, position: 60, size: 10},
		{node: {} as Box, position: 65, size: 10},
		{node: {} as Box, position: 70, size: 10},
		{node: {} as Box, position: 75, size: 10},
		{node: {} as Box, position: 80, size: 10},
		{node: {} as Box, position: 85, size: 10}
	])

	sorting.sort()

	expect(sorting.items).toEqual([ // TODO: this is not perfect, overflow should be distributed equally or items shrinked
		{node: {} as Box, position: 0, size: 10},
		{node: {} as Box, position: 10, size: 10},
		{node: {} as Box, position: 20, size: 10},
		{node: {} as Box, position: 30, size: 10},
		{node: {} as Box, position: 40, size: 10},
		{node: {} as Box, position: 50, size: 10},
		{node: {} as Box, position: 60, size: 10},
		{node: {} as Box, position: 70, size: 10},
		{node: {} as Box, position: 80, size: 10},
		{node: {} as Box, position: 90, size: 10},
		{node: {} as Box, position: 100, size: 10},
		{node: {} as Box, position: 110, size: 10},
		{node: {} as Box, position: 120, size: 10},
		{node: {} as Box, position: 130, size: 10},
		{node: {} as Box, position: 140, size: 10},
		{node: {} as Box, position: 150, size: 10}
	])
})

test('16 items with overlappings, with margin', () => {
	const sorting = new Sorting(0, 100, [
		{node: {} as Box, position: 10, size: 10},
		{node: {} as Box, position: 15, size: 10},
		{node: {} as Box, position: 20, size: 10},
		{node: {} as Box, position: 25, size: 10},
		{node: {} as Box, position: 30, size: 10},
		{node: {} as Box, position: 35, size: 10},
		{node: {} as Box, position: 40, size: 10},
		{node: {} as Box, position: 45, size: 10},
		{node: {} as Box, position: 50, size: 10},
		{node: {} as Box, position: 55, size: 10},
		{node: {} as Box, position: 60, size: 10},
		{node: {} as Box, position: 65, size: 10},
		{node: {} as Box, position: 70, size: 10},
		{node: {} as Box, position: 75, size: 10},
		{node: {} as Box, position: 80, size: 10},
		{node: {} as Box, position: 85, size: 10}
	], 4)

	sorting.sort()

	expect(sorting.items).toEqual([ // TODO: this is not perfect, overflow should be distributed equally or items shrinked
		{node: {} as Box, position: 0, size: 10},
		{node: {} as Box, position: 14, size: 10},
		{node: {} as Box, position: 28, size: 10},
		{node: {} as Box, position: 42, size: 10},
		{node: {} as Box, position: 56, size: 10},
		{node: {} as Box, position: 70, size: 10},
		{node: {} as Box, position: 84, size: 10},
		{node: {} as Box, position: 98, size: 10},
		{node: {} as Box, position: 112, size: 10},
		{node: {} as Box, position: 126, size: 10},
		{node: {} as Box, position: 140, size: 10},
		{node: {} as Box, position: 154, size: 10},
		{node: {} as Box, position: 168, size: 10},
		{node: {} as Box, position: 182, size: 10},
		{node: {} as Box, position: 196, size: 10},
		{node: {} as Box, position: 210, size: 10}
	])
})