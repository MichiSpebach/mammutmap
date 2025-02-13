import { Widget } from '../../Widget';
import { RenderElements } from '../../renderEngine/RenderElement';
import { Box } from '../Box';

export type BoxTab = {
    name: string;
    isAvailableFor: (box: Box) => boolean | Promise<boolean>;
    isDefaultSelectedFor?: (box: Box) => boolean | Promise<void>;
    buildWidget: (box: Box) => RenderElements | Widget | Promise<RenderElements | Widget>;
};
