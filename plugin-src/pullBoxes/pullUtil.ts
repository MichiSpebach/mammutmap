import { ClientPosition } from '../../src/core/shape/ClientPosition'
import { ClientRect } from '../../src/core/ClientRect'
import { map, Map } from '../../src/core/Map'
import { AwaitBlockingScheduler } from './AwaitBlockingScheduler'

export const detachScheduler = new AwaitBlockingScheduler()

export async function getIntersectionRect(): Promise<ClientRect> {
	const mapRect: ClientRect = await getUncoveredMapClientRect()
	return new ClientRect(mapRect.x+120, mapRect.y+60, mapRect.width-240, mapRect.height-140)
}

export async function getUncoveredMapClientRect(): Promise<ClientRect> {
	return await getMap().getUncoveredMapClientRect()
}

export function getMap(): Map {
	if (!map) {
		throw new Error('pullBoxes: !map, no folder opened')
	}
	return map
}

/*export async function calculateWishRect(size: {width: number, height: number}, wishPosition: ClientPosition, preserveAspectRatio: boolean): Promise<ClientRect> {
	const sideRect: ClientRect = await getSideRect((await getNearestSideOfPosition(wishPosition)).nearestSide)
	const wishRect: ClientRect = new ClientRect(wishPosition.x - size.width/2, wishPosition.y - size.height/2, size.width, size.height)
	const fittedRect: ClientRect = ClientRect.fromPositions(
		new ClientPosition(Math.max(sideRect.x, wishRect.y), Math.max(sideRect.y, wishRect.y)),
		new ClientPosition(Math.min(sideRect.getRightX(), wishRect.getRightX()), Math.min(sideRect.getBottomY(), wishRect.getBottomY()))
	)
	let x: number
	if (sideRect.x < wishRect.x) {
		x = wishRect.x
	}
}*/

export async function getNearestMapSideOfPosition(position: ClientPosition): Promise<{nearestSide: 'left'|'top'|'right'|'bottom', distanceToNearestSide: number}> {
	return getNearestRectSideOfPosition(position, await getUncoveredMapClientRect())
}

export function getNearestRectSideOfPosition(position: ClientPosition, rect: ClientRect): {nearestSide: 'left'|'top'|'right'|'bottom', distanceToNearestSide: number} {
	let nearestSide: 'left'|'top'|'right'|'bottom' = 'right'
	let distanceToNearestSide: number = rect.getRightX() - position.x
	if (distanceToNearestSide > position.x - rect.x) {
		nearestSide = 'left'
		distanceToNearestSide = position.x - rect.x
	}
	if (distanceToNearestSide > position.y - rect.y) {
		nearestSide = 'top'
		distanceToNearestSide = position.y - rect.y
	}
	if (distanceToNearestSide > rect.getBottomY() - position.y) {
		nearestSide = 'bottom'
		distanceToNearestSide = rect.getBottomY() - position.y
	}
	return {nearestSide, distanceToNearestSide}
}

export async function getSideRect(side: 'left'|'top'|'right'|'bottom'): Promise<ClientRect> {
	const mapRect: ClientRect = await getUncoveredMapClientRect()
	switch (side) {
		case 'left':
			return new ClientRect(mapRect.x, mapRect.y, mapRect.x + mapRect.width*0.2, mapRect.height)
		case 'top':
			return new ClientRect(mapRect.x, mapRect.y, mapRect.width, mapRect.y + mapRect.height*0.2)
		case 'right':
			return new ClientRect(mapRect.x + mapRect.width*0.8, mapRect.y, mapRect.width*0.2, mapRect.height)
		case 'bottom':
			return new ClientRect(mapRect.x, mapRect.y + mapRect.height*0.8, mapRect.width, mapRect.height*0.2)
	}
}

export function shrinkRectToAspectRatio(rect: ClientRect, aspectRatio: number): ClientRect {
	if (rect.width/rect.height > aspectRatio) {
		const fittedWidth: number = rect.height*aspectRatio
		return new ClientRect(rect.x + (rect.width-fittedWidth)/2, rect.y, fittedWidth, rect.height)
	} else {
		const fittedHeight: number = rect.width/aspectRatio
		return new ClientRect(rect.x, rect.y + (rect.height-fittedHeight)/2, rect.width, fittedHeight)
	}
}

export function calculateOverlap(from: ClientRect, to: ClientRect, direction: {x: number, y: number}): number|undefined {
	if (!from.isOverlappingWith(to)) {
		return undefined
	}
	if (direction.x > 0) {
		return from.getRightX() - to.x
	}
	if (direction.x < 0) {
		return to.getRightX() - from.x
	}
	if (direction.y > 0) {
		return from.getBottomY() - to.y
	}
	if (direction.y < 0) {
		return to.getBottomY() - from.y
	}
	console.warn('pullBoxes: pullUtil.calculateOverlap direction.x and direction.y are both 0')
	return undefined
}

export function calculateDistance(from: ClientRect, to: ClientRect, direction: {x: number, y: number}): number|undefined {
	if (direction.x !== 0 && from.y < to.getBottomY() && from.getBottomY() > to.y) {
		if (direction.x > 0 && from.getRightX() < to.x) {
			return to.x - from.getRightX()
		}
		if (direction.x < 0 && to.getRightX() < from.x) {
			return from.x - to.getRightX()
		}
	}
	if (direction.y !== 0 && from.getRightX() > to.x && from.x < to.getRightX()) {
		if (direction.y > 0 && from.getBottomY() < to.y) {
			return to.y - from.getBottomY()
		}
		if (direction.y < 0 && to.getBottomY() < from.y) {
			return from.y - to.getBottomY()
		}
	}
	return undefined
}