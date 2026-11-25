import { hardwareTypes, findHardwareType } from './catalog/hardwareTypes.js';
import { driveTypes, findDriveType } from './catalog/driveTypes.js';
import { readLabelSpec, LabelSpecError } from './label/labelSpec.js';
import { describeLabelSpecError } from './label/errorMessages.js';
import { renderLabel } from './label/renderLabel.js';
import { buildFileName } from './label/fileName.js';
import { downloadSvg } from './download.js';

const form = document.getElementById('label-form');
const hardwareTypeSelect = document.getElementById('hardware-type');
const driveFields = document.getElementById('drive-fields');
const driveTypeSelect = document.getElementById('drive-type');
const driveSizeSelect = document.getElementById('drive-size');
const preview = document.getElementById('preview');
const errorMessage = document.getElementById('error-message');
const downloadButton = document.getElementById('download');

function replaceOptions(select, options) {
  select.replaceChildren(...options.map(({ value, label }) => new Option(label, value)));
}

function populateHardwareTypes() {
  replaceOptions(hardwareTypeSelect, hardwareTypes.map(({ key, label }) => ({ value: key, label })));
}

function populateDriveTypes() {
  const noDrive = { value: '', label: 'Aucune' };
  replaceOptions(driveTypeSelect, [noDrive, ...driveTypes.map(({ key, label }) => ({ value: key, label }))]);
}

function populateDriveSizes() {
  const sizes = findDriveType(driveTypeSelect.value)?.sizes ?? [];
  replaceOptions(driveSizeSelect, sizes.map((size) => ({ value: size, label: size })));
}

function showDriveFieldsOnlyForHardwareWithDrive() {
  driveFields.hidden = !findHardwareType(hardwareTypeSelect.value).hasDrive;
}

function readDriveType() {
  return driveFields.hidden ? '' : driveTypeSelect.value;
}

function readFormFields() {
  return {
    width: document.getElementById('width').value,
    height: document.getElementById('height').value,
    hardwareType: hardwareTypeSelect.value,
    driveType: readDriveType(),
    driveSize: driveSizeSelect.value,
    dimensions: document.getElementById('dimensions').value,
    hasFrame: document.getElementById('has-frame').checked,
  };
}

let generatedLabel = null;

function showLabel(spec) {
  generatedLabel = { svg: renderLabel(spec), fileName: buildFileName(spec) };
  errorMessage.textContent = '';
  preview.innerHTML = generatedLabel.svg;
  downloadButton.disabled = false;
}

function showInvalidField(error) {
  if (!(error instanceof LabelSpecError)) {
    throw error;
  }
  errorMessage.textContent = describeLabelSpecError(error);
  preview.replaceChildren();
}

function generateLabel(event) {
  event.preventDefault();
  try {
    showLabel(readLabelSpec(readFormFields()));
  } catch (error) {
    showInvalidField(error);
  }
}

function forgetGeneratedLabel() {
  generatedLabel = null;
  downloadButton.disabled = true;
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
form.addEventListener('input', forgetGeneratedLabel);
downloadButton.addEventListener('click', downloadGeneratedLabel);
