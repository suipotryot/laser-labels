import { hardwareTypes, findHardwareType } from './catalog/hardwareTypes.js';
import { driveTypes, findDriveType } from './catalog/driveTypes.js';
import { readLabelSpec, LabelSpecError } from './label/labelSpec.js';
import { describeLabelSpecError } from './label/errorMessages.js';
import { renderLabel } from './label/renderLabel.js';
import { buildFileName } from './label/fileName.js';
import { downloadSvg } from './download.js';

const OUTDATED_PREVIEW_NOTICE = "Le formulaire a changé : cliquez sur Générer pour mettre à jour l'aperçu.";

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

function replaceOptions(select, options) {
  select.replaceChildren(...options.map(({ value, label }) => new Option(label, value)));
}

function toOption({ key, label }) {
  return { value: key, label };
}

function populateHardwareTypes() {
  replaceOptions(hardwareTypeSelect, hardwareTypes.map(toOption));
}

function populateDriveTypes() {
  const noDrive = { value: '', label: 'Aucune' };
  replaceOptions(driveTypeSelect, [noDrive, ...driveTypes.map(toOption)]);
}

function sizesOfChosenDriveType() {
  if (driveTypeSelect.value === '') {
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

function readDriveType() {
  return driveFields.hidden ? '' : driveTypeSelect.value;
}

function readFormFields() {
  return {
    width: widthInput.value,
    height: heightInput.value,
    hardwareType: hardwareTypeSelect.value,
    driveType: readDriveType(),
    driveSize: driveSizeSelect.value,
    dimensions: dimensionsInput.value,
    hasFrame: hasFrameCheckbox.checked,
  };
}

let generatedLabel = null;

function forgetGeneratedLabel() {
  generatedLabel = null;
  downloadButton.disabled = true;
}

function showLabel(spec) {
  generatedLabel = { svg: renderLabel(spec), fileName: buildFileName(spec) };
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
    showLabel(readLabelSpec(readFormFields()));
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
