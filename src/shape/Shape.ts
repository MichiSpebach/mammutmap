import { Position } from '../box/Transform'

export abstract class Shape<POSITION extends Position<POSITION>> {

  public abstract calculateIntersectionsWithLine(line: {from: POSITION, to: POSITION}): POSITION[]

}
