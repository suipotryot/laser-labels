import { hardwareTypes, findHardwareType } from './catalog/hardwareTypes.js';
import { driveTypes, findDriveType, NO_DRIVE } from './catalog/driveTypes.js';
import { readLabelSpec, LabelSpecError } from './label/labelSpec.js';
import { describeLabelSpecError } from './label/errorMessages.js';
import { renderLabel } from './label/renderLabel.js';
import { buildFileName } from './label/fileName.js';
import { downloadSvg } from './download.js';
import { loadFont } from './text/loadFont.js';

const OUTDATED_PREVIEW_NOTICE = "Le formulaire a changé : cliquez sur Générer pour mettre à jour l'aperçu.";
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
const generateButton = document.getElementById('generate');
const downloadButton = document.getElementById('download');

function replaceOptions(select, options) {
  select.replaceChildren(...options.map(({ value, label }) => new Option(label, value)));
}

function toOption({ key, name }) {
  return { value: key, label: name };
}

function populateHardwareTypes() {
  replaceOptions(hardwareTypeSelect, hardwareTypes.map(toOption));
}

function populateDriveTypes() {
  const noDrive = { value: NO_DRIVE, label: 'Aucune' };
  replaceOptions(driveTypeSelect, [noDrive, ...driveTypes.map(toOption)]);
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
  replaceOptions(driveSizeSelect, sizesOfChosenDriveType().map((size) => ({ value: size, label: size })));
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

function enableGenerationWith(font) {
  engravingFont = font;
  generateButton.disabled = false;
}

function explainFontLoadingFailure(error) {
  errorMessage.textContent = FONT_LOADING_FAILURE_NOTICE;
  throw error;
}

let generatedLabel = null;

function forgetGeneratedLabel() {
  generatedLabel = null;
  downloadButton.disabled = true;
}

function rememberAndShowLabel(spec) {
  generatedLabel = { svg: renderLabel(spec, engravingFont), fileName: buildFileName(spec) };
  errorMessage.textContent = '';
  previewStatus.textContent = '';
  preview.classList.remove('is-outdated');
  preview.innerHTML = generatedLabel.svg;
  downloadButton.disabled = false;
}

function explainInvalidField(error) {
  forgetGeneratedLabel();
  errorMessage.textContent = describeLabelSpecError(error);
  previewStatus.textContent = '';
  preview.replaceChildren();
}

function generateLabel(event) {
  event.preventDefault();
  try {
    rememberAndShowLabel(readLabelSpec(readFormFields()));
  } catch (error) {
    if (!(error instanceof LabelSpecError)) {
      throw error;
    }
    explainInvalidField(error);
  }
}

function isPreviewShown() {
  return preview.childElementCount > 0;
}

function markPreviewAsOutdated() {
  if (isPreviewShown()) {
    previewStatus.textContent = OUTDATED_PREVIEW_NOTICE;
    preview.classList.add('is-outdated');
  }
}

function handleFormChange() {
  forgetGeneratedLabel();
  markPreviewAsOutdated();
}

function downloadGeneratedLabel() {
  downloadSvg(generatedLabel.svg, generatedLabel.fileName);
}

populateHardwareTypes();
populateDriveTypes();
populateDriveSizes();
showDriveFieldsOnlyForHardwareWithDrive();
hardwareTypeSelect.addEventListener('change', showDriveFieldsOnlyForHardwareWithDrive);
driveTypeSelect.addEventListener('change', populateDriveSizes);
form.addEventListener('submit', generateLabel);
form.addEventListener('input', handleFormChange);
downloadButton.addEventListener('click', downloadGeneratedLabel);
loadFont().then(enableGenerationWith, explainFontLoadingFailure);
