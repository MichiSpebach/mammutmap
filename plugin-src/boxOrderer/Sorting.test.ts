import { Box } from '../../dist/core/box/Box'
import { Sorting } from './Sorting'

test('enough space between items', () => {
	const sorting = new Sorting([
		{node: {} as Box, position: 10, size: 10},
		{node: {} as Box, position: 80, size: 10}
	])

	sorting.sort()

	expect(sorting.items).toEqual([
		{node: {} as Box, position: 10, size: 10},
		{node: {} as Box, position: 80, size: 10}
	])
})

test('position too small', () => {
	const sorting = new Sorting([
		{node: {} as Box, position: -10, size: 20}
	])
	sorting.sort()
	expect(sorting.items).toEqual([
		{node: {} as Box, position: 0, size: 20}
	])
})

test('position too big', () => {
	const sorting = new Sorting([
		{node: {} as Box, position: 90, size: 20}
	])
	sorting.sort()
	expect(sorting.items).toEqual([
		{node: {} as Box, position: 80, size: 20}
	])
})

test('two items are overlapping', () => {
	const sorting = new Sorting([
		{node: {} as Box, position: 45, size: 20},
		{node: {} as Box, position: 55, size: 20}
	])

	sorting.sort()

	expect(sorting.items).toEqual([
		{node: {} as Box, position: 40, size: 20},
		{node: {} as Box, position: 60, size: 20}
	])
})

test('5 items with overlappings', () => {
	const sorting = new Sorting([
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

test('10 items with overlappings', () => {
	const sorting = new Sorting([
		{node: {} as Box, position: 25, size: 10},
		{node: {} as Box, position: 30, size: 10},
		{node: {} as Box, position: 35, size: 10},
		{node: {} as Box, position: 40, size: 10},
		{node: {} as Box, position: 45, size: 10},
		{node: {} as Box, position: 50, size: 10},
		{node: {} as Box, position: 55, size: 10},
		{node: {} as Box, position: 60, size: 10},
		{node: {} as Box, position: 65, size: 10},
		{node: {} as Box, position: 70, size: 10}
	])

	sorting.sort()

	expect(sorting.items).toEqual([
		{node: {} as Box, position: 0, size: 10},
		{node: {} as Box, position: 10, size: 10},
		{node: {} as Box, position: 20, size: 10},
		{node: {} as Box, position: 30, size: 10},
		{node: {} as Box, position: 40, size: 10},
		{node: {} as Box, position: 50, size: 10},
		{node: {} as Box, position: 60, size: 10},
		{node: {} as Box, position: 70, size: 10},
		{node: {} as Box, position: 80, size: 10},
		{node: {} as Box, position: 90, size: 10}
	])
})