import { hardwareTypes, findHardwareType } from './catalog/hardwareTypes.js';
import { driveTypes, findDriveType, NO_DRIVE } from './catalog/driveTypes.js';
import { readLabelSpec, LabelSpecError } from './label/labelSpec.js';
import { describeLabelSpecError } from './label/errorMessages.js';
import { renderLabel } from './label/renderLabel.js';
import { isLabelTooSmallToRead } from './label/labelReadability.js';
import { buildFileName } from './label/fileName.js';
import { downloadSvg } from './download.js';
import { loadEngravingFont } from './text/loadEngravingFont.js';

const SMALL_DETAILS_NOTICE = "Certains détails sont très petits : ils risquent d'être illisibles une fois gravés.";
const FONT_LOADING_FAILURE_NOTICE = "La police de gravure n'a pas pu être chargée : rechargez la page.";

const form = document.getElementById('label-form');
const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');
const hasFrameCheckbox = document.getElementById('has-frame');
const hardwareTypeSelect = document.getElementById('hardware-type');
const dimensionsInput = document.getElementById('dimensions');
const driveFields = document.getElementById('drive-fields');
const driveTypeSelect = document.getElementById('drive-type');
const driveSizeSelect = document.getElementById('drive-size');
const errorMessage = document.getElementById('error-message');
const previewStatus = document.getElementById('preview-status');
const preview = document.getElementById('preview');
const downloadButton = document.getElementById('download');

function toOption({ key, name }) {
  return new Option(name, key);
}

function populateHardwareTypes() {
  hardwareTypeSelect.replaceChildren(...hardwareTypes.map(toOption));
}

function populateDriveTypes() {
  const noDrive = new Option('Aucune', NO_DRIVE);
  driveTypeSelect.replaceChildren(noDrive, ...driveTypes.map(toOption));
}

function sizesOfChosenDriveType() {
  if (driveTypeSelect.value === NO_DRIVE) {
    return [];
  }
  const driveType = findDriveType(driveTypeSelect.value);
  if (!driveType) {
    throw new Error(`Unknown drive type in the form: ${driveTypeSelect.value}`);
  }
  return driveType.sizes;
}

function populateDriveSizes() {
  driveSizeSelect.replaceChildren(...sizesOfChosenDriveType().map((size) => new Option(size, size)));
}

function showDriveFieldsOnlyForHardwareWithDrive() {
  driveFields.hidden = !findHardwareType(hardwareTypeSelect.value).hasDrive;
}

function readDriveTypeIfShown() {
  return driveFields.hidden ? NO_DRIVE : driveTypeSelect.value;
}

function readFormFields() {
  return {
    width: widthInput.value,
    height: heightInput.value,
    hardwareType: hardwareTypeSelect.value,
    driveType: readDriveTypeIfShown(),
    driveSize: driveSizeSelect.value,
    dimensions: dimensionsInput.value,
    hasFrame: hasFrameCheckbox.checked,
  };
}

let engravingFont = null;

function explainFontLoadingFailure(error) {
  errorMessage.textContent = FONT_LOADING_FAILURE_NOTICE;
  throw error;
}

let drawnLabel = null;

function forgetDrawnLabel() {
  drawnLabel = null;
  downloadButton.disabled = true;
}

function clearMessages() {
  errorMessage.textContent = '';
  previewStatus.textContent = '';
}

function showPreview(svg) {
  clearMessages();
  preview.innerHTML = svg;
  downloadButton.disabled = false;
}

function warnIfLabelIsTooSmall(spec) {
  if (isLabelTooSmallToRead(spec, engravingFont)) {
    previewStatus.textContent = SMALL_DETAILS_NOTICE;
  }
}

function rememberAndShowLabel(spec) {
  drawnLabel = { svg: renderLabel(spec, engravingFont), fileName: buildFileName(spec) };
  showPreview(drawnLabel.svg);
  warnIfLabelIsTooSmall(spec);
}

function explainInvalidField(error) {
  forgetDrawnLabel();
  clearMessages();
  errorMessage.textContent = describeLabelSpecError(error);
  preview.replaceChildren();
}

function drawLabel() {
  try {
    rememberAndShowLabel(readLabelSpec(readFormFields(), engravingFont));
  } catch (error) {
    if (!(error instanceof LabelSpecError)) {
      throw error;
    }
    explainInvalidField(error);
  }
}

function startDrawingWith(font) {
  engravingFont = font;
  form.addEventListener('input', drawLabel);
  drawLabel();
}

function downloadDrawnLabel() {
  downloadSvg(drawnLabel.svg, drawnLabel.fileName);
}

populateHardwareTypes();
populateDriveTypes();
populateDriveSizes();
showDriveFieldsOnlyForHardwareWithDrive();
hardwareTypeSelect.addEventListener('input', showDriveFieldsOnlyForHardwareWithDrive);
driveTypeSelect.addEventListener('input', populateDriveSizes);
downloadButton.addEventListener('click', downloadDrawnLabel);
loadEngravingFont().then(startDrawingWith, explainFontLoadingFailure);
