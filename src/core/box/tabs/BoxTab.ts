import { Widget } from '../../Widget';
import { RenderElements } from '../../util/RenderElement';
import { Box } from '../Box';

export type BoxTab = {
    name: string;
    isAvailableFor: (box: Box) => boolean | Promise<boolean>;
    buildWidget: (box: Box) => RenderElements | Widget | Promise<RenderElements | Widget>;
};
