import { Position } from './Position'

export abstract class Shape<POSITION extends Position<POSITION>> {

  public abstract calculateIntersectionsWithLine(line: {from: POSITION, to: POSITION}): POSITION[]

}
