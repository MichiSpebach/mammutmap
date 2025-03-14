import { renderManager, RenderPriority } from '../../renderEngine/renderManager';
import { Draggable } from '../../Draggable';
import { DropTarget } from '../../DropTarget';
import { relocationDragManager } from '../../RelocationDragManager';
import { ClientRect } from '../../ClientRect';
import { Box } from '../Box';
import { FolderBox } from '../FolderBox';
import { ClientPosition } from '../../shape/ClientPosition';
import { LocalPosition } from '../../shape/LocalPosition';
import { settings } from '../../settings/settings';
import { util } from '../../util/util';

export class BoxHeaderDraggable implements Draggable<FolderBox> {
  private dragOffset: { x: number; y: number; } = { x: 0, y: 0 }; // TODO: move into DragManager and let DragManager return calculated position of box (instead of pointer)

  public constructor(
    public readonly id: string,
    public readonly referenceBox: Box
  ) { }

  public getId(): string {
    return this.id;
  }

  public getManagingBox(): Box {
    return this.referenceBox.getParent();
  }

  public getDropTargetAtDragStart(): FolderBox {
    if (this.referenceBox.isRoot()) {
      return this.referenceBox as FolderBox; // in order that RootFolderBox can be dragged
    }
    return this.referenceBox.getParent();
  }

  public canBeDroppedInto(dropTarget: DropTarget): boolean {
    return settings.getBoolean('boxesDraggableIntoOtherBoxes') && dropTarget instanceof FolderBox;
  }

  public async dragStart(clientX: number, clientY: number, dropTarget: FolderBox, snapToGrid: boolean): Promise<void> {
    const clientRect: ClientRect = await this.referenceBox.getClientRect();
    this.dragOffset = { x: clientX - clientRect.x, y: clientY - clientRect.y };
    await renderManager.addClassTo(this.referenceBox.getId(), relocationDragManager.draggingInProgressStyleClass, RenderPriority.RESPONSIVE);
  }

  public async drag(clientX: number, clientY: number, dropTarget: FolderBox, snapToGrid: boolean): Promise<void> {
    if (this.referenceBox.isRoot()) {
      util.logWarning('BoxHeader::drag(..) called on rootBox, cannot drag root, also this should never happen.');
      return;
    }
    const clientPosition = new ClientPosition(clientX - this.dragOffset.x, clientY - this.dragOffset.y);

    let positionInParentBoxCoords: LocalPosition;
    const boxDetached: boolean = this.referenceBox.site.isDetached()
    if (!snapToGrid || boxDetached) {
      positionInParentBoxCoords = await this.referenceBox.getParent().transform.clientToLocalPosition(clientPosition);
    } else {
      positionInParentBoxCoords = await this.referenceBox.getParent().transform.getNearestGridPositionOfOtherTransform(clientPosition, dropTarget.transform);
    }

    await this.referenceBox.updateMeasuresAndBorderingLinks({ x: positionInParentBoxCoords.percentX, y: positionInParentBoxCoords.percentY }, RenderPriority.RESPONSIVE);
    if (!boxDetached) {
      await dropTarget.rearrangeBoxesWithoutMapData(this.referenceBox);
    }
  }

  public async dragCancel(): Promise<void> {
    const pros: Promise<void>[] = []

    pros.push(renderManager.removeClassFrom(this.referenceBox.getId(), relocationDragManager.draggingInProgressStyleClass, RenderPriority.RESPONSIVE))
    if (!this.referenceBox.site.isDetached()) {
      pros.push(this.referenceBox.restoreMapData())
    }
    
    await Promise.all(pros)
  }

  public async dragEnd(clientX: number, clientY: number, dropTarget: FolderBox, snapToGrid: boolean): Promise<void> {
    const pros: Promise<void>[] = [];

    pros.push(renderManager.removeClassFrom(this.referenceBox.getId(), relocationDragManager.draggingInProgressStyleClass, RenderPriority.RESPONSIVE));

    if (this.referenceBox.site.isDetached()) {
      await Promise.all(pros)
      return
    }

    if (!this.referenceBox.isRoot() && this.referenceBox.getParent() != dropTarget) {
      pros.push(this.referenceBox.setParentAndFlawlesslyResizeAndSave(dropTarget));
    } else {
      pros.push(this.referenceBox.saveMapData());
    }

    await Promise.all(pros);
  }
}
