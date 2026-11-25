import { hardwareTypes, findHardwareType } from './catalog/hardwareTypes.js';
import { driveTypes, findDriveType, NO_DRIVE } from './catalog/driveTypes.js';
import { readLabelSpec, LabelSpecError } from './label/labelSpec.js';
import { describeLabelSpecError } from './label/errorMessages.js';
import { renderLabel } from './label/renderLabel.js';
import { hasDetailsTooSmallToEngrave } from './label/labelReadability.js';
import { buildFileName } from './label/fileName.js';
import { downloadSvg } from './download.js';
import { loadEngravingFont } from './text/loadEngravingFont.js';

const SMALL_DETAILS_NOTICE = "Certains détails sont très petits : ils risquent d'être illisibles une fois gravés.";
const FONT_LOADING_FAILURE_NOTICE = "La police de gravure n'a pas pu être chargée : rechargez la page.";
const FONT_LOADING_NOTICE = "Chargement de la police de gravure…";
const UNEXPECTED_ERROR_NOTICE = "Une erreur inattendue empêche de dessiner l'étiquette.";

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
let previewedLabel = null;

function rememberPreviewedLabel(label) {
  previewedLabel = label;
  downloadButton.disabled = false;
}

function forgetPreviewedLabel() {
  previewedLabel = null;
  downloadButton.disabled = true;
}

function updateText(element, text) {
  if (element.textContent !== text) {
    element.textContent = text;
  }
}

function showMessages({ error = '', status = '' }) {
  updateText(errorMessage, error);
  updateText(previewStatus, status);
}

function smallDetailsWarningFor(spec) {
  return hasDetailsTooSmallToEngrave(spec, engravingFont) ? SMALL_DETAILS_NOTICE : '';
}

function previewLabel(spec) {
  rememberPreviewedLabel({ svg: renderLabel(spec, engravingFont), fileName: buildFileName(spec) });
  preview.innerHTML = previewedLabel.svg;
  showMessages({ status: smallDetailsWarningFor(spec) });
}

function clearPreview() {
  forgetPreviewedLabel();
  preview.replaceChildren();
}

function explainInvalidField(error) {
  clearPreview();
  showMessages({ error: describeLabelSpecError(error) });
}

function explainUnexpectedError(error) {
  clearPreview();
  showMessages({ error: UNEXPECTED_ERROR_NOTICE });
  throw error;
}

function refreshPreview() {
  try {
    previewLabel(readLabelSpec(readFormFields(), engravingFont));
  } catch (error) {
    if (error instanceof LabelSpecError) {
      explainInvalidField(error);
    } else {
      explainUnexpectedError(error);
    }
  }
}

function downloadPreviewedLabel() {
  downloadSvg(previewedLabel.svg, previewedLabel.fileName);
}

function startPreviewingWith(font) {
  engravingFont = font;
  form.addEventListener('input', refreshPreview);
  refreshPreview();
}

function explainFontLoadingFailure(error) {
  showMessages({ error: FONT_LOADING_FAILURE_NOTICE });
  throw error;
}

populateHardwareTypes();
populateDriveTypes();
populateDriveSizes();
showDriveFieldsOnlyForHardwareWithDrive();
showMessages({ status: FONT_LOADING_NOTICE });
hardwareTypeSelect.addEventListener('input', showDriveFieldsOnlyForHardwareWithDrive);
driveTypeSelect.addEventListener('input', populateDriveSizes);
downloadButton.addEventListener('click', downloadPreviewedLabel);
loadEngravingFont().then(startPreviewingWith, explainFontLoadingFailure);
