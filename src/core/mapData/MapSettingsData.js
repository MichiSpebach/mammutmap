"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapSettingsData = void 0;
const util_1 = require("../util/util");
const BoxData_1 = require("./BoxData");
const LinkAppearanceData_1 = require("./LinkAppearanceData");
const LinkTagData_1 = require("./LinkTagData");
class MapSettingsData extends BoxData_1.BoxData {
    static ofRawObject(object) {
        const boxData = BoxData_1.BoxData.ofRawObject(object);
        const mapSettingsData = Object.setPrototypeOf(boxData, MapSettingsData.prototype);
        mapSettingsData.linkTags = object.linkTags ? object.linkTags.map((rawTag) => LinkTagData_1.LinkTagData.ofRawObject(rawTag)) : [];
        if (mapSettingsData.defaultLinkAppearance) {
            mapSettingsData.defaultLinkAppearance = LinkAppearanceData_1.LinkAppearanceData.ofRawObject(mapSettingsData.defaultLinkAppearance);
        }
        else {
            mapSettingsData.defaultLinkAppearance = new LinkAppearanceData_1.LinkAppearanceData();
        }
        mapSettingsData.validateMapSettingsData();
        return mapSettingsData;
    }
    constructor(options) {
        super(options.id, options.x, options.y, options.width, options.height, options.links, options.nodes);
        this.srcRootPath = options.srcRootPath;
        this.mapRootPath = options.mapRootPath;
        this.linkTags = options.linkTags;
        if (options.defaultLinkAppearance) {
            this.defaultLinkAppearance = options.defaultLinkAppearance;
        }
        else {
            this.defaultLinkAppearance = new LinkAppearanceData_1.LinkAppearanceData();
        }
        this.validateMapSettingsData();
    }
    validateMapSettingsData() {
        super.validate();
        if (!this.srcRootPath || !this.mapRootPath) { // can happen when called with type any
            let message = 'MapSettingsData need to have a srcRootPath and a mapRootPath';
            message += ', but specified srcRootPath is ' + this.srcRootPath + ' and mapRootPath is ' + this.mapRootPath + '.';
            util_1.util.logWarning(message);
        }
        if (!this.linkTags) {
            util_1.util.logWarning('MapSettingsData::linkTags are undefined or null.');
        }
        if (!this.defaultLinkAppearance) {
            util_1.util.logWarning('MapSettingsData::defaultLinkAppearance is undefined or null.');
        }
    }
    getLinkTagNamesWithDefaults() {
        let tagNames = this.linkTags.map(tag => tag.name);
        for (const defaultTagName of LinkTagData_1.LinkTagData.defaultTagNames) {
            if (!tagNames.includes(defaultTagName)) {
                tagNames.push(defaultTagName);
            }
        }
        return tagNames;
    }
    countUpLinkTag(tagName) {
        let tag = this.linkTags.find(tag => tag.name === tagName);
        if (!tag) {
            tag = new LinkTagData_1.LinkTagData(tagName, 1);
            this.linkTags.push(tag);
        }
        else {
            tag.count += 1;
        }
    }
    countDownLinkTag(tagName) {
        let tag = this.linkTags.find(tag => tag.name === tagName);
        if (!tag) {
            util_1.util.logWarning(`cannot count down tag ${tagName} because it is not known`);
            return;
        }
        if (tag.count <= 1) {
            this.linkTags.splice(this.linkTags.indexOf(tag), 1);
        }
        else {
            tag.count -= 1;
        }
    }
}
exports.MapSettingsData = MapSettingsData;
