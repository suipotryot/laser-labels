import { hardwareTypes, findHardwareType } from './catalog/hardwareTypes.js';
import { driveTypes, findDriveType, NO_DRIVE } from './catalog/driveTypes.js';
import { usageTypes } from './catalog/usageTypes.js';
import { readLabelSpec, LabelSpecError } from './label/labelSpec.js';
import { describeLabelSpecError } from './label/errorMessages.js';
import { renderLabel } from './label/renderLabel.js';
import { hasDetailsTooSmallToEngrave } from './label/labelReadability.js';
import { buildFileName } from './label/fileName.js';
import { buildLabelFieldsQuery } from './label/labelFieldsQuery.js';
import { downloadSvg } from './download.js';
import { loadEngravingFont } from './text/loadEngravingFont.js';
import { languages, translate } from './i18n/translate.js';
import { readStoredLanguage, storeLanguage } from './i18n/storedLanguage.js';

let language = readStoredLanguage(localStorage);

function textFor(key, parameters) {
  return translate(language, key, parameters);
}

const form = document.getElementById('label-form');
const languageSelect = document.getElementById('language');
const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');
const hasFrameCheckbox = document.getElementById('has-frame');
const hardwareTypeSelect = document.getElementById('hardware-type');
const dimensionsInput = document.getElementById('dimensions');
const usageFields = document.getElementById('usage-fields');
const driveFields = document.getElementById('drive-fields');
const driveTypeSelect = document.getElementById('drive-type');
const driveSizeSelect = document.getElementById('drive-size');
const errorMessage = document.getElementById('error-message');
const previewStatus = document.getElementById('preview-status');
const preview = document.getElementById('preview');
const downloadButton = document.getElementById('download');
const imageUrlInput = document.getElementById('image-url');

function translateStaticTexts() {
  document.documentElement.lang = language;
  for (const element of document.querySelectorAll('[data-i18n]')) {
    element.textContent = textFor(element.dataset.i18n);
  }
}

function populateLanguages() {
  languageSelect.replaceChildren(...languages.map((code) => new Option(code.toUpperCase(), code)));
  languageSelect.value = language;
}

function repopulateKeepingChoice(select, populate) {
  const chosenIndex = Math.max(select.selectedIndex, 0);
  populate();
  select.selectedIndex = chosenIndex;
}

function toTranslatedOption(prefix) {
  return ({ key }) => new Option(textFor(`${prefix}.${key}`), key);
}

function populateHardwareTypes() {
  hardwareTypeSelect.replaceChildren(...hardwareTypes.map(toTranslatedOption('hardware')));
}

function toUsageCheckbox({ key }) {
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.value = key;
  const label = document.createElement('label');
  label.append(checkbox, ` ${textFor(`usage.${key}`)}`);
  return label;
}

function readTickedUsages() {
  return Array.from(usageFields.querySelectorAll('input:checked'), (checkbox) => checkbox.value);
}

function populateUsages() {
  const tickedUsages = readTickedUsages();
  usageFields.querySelectorAll('label').forEach((label) => label.remove());
  usageFields.append(...usageTypes.map(toUsageCheckbox));
  for (const checkbox of usageFields.querySelectorAll('input')) {
    checkbox.checked = tickedUsages.includes(checkbox.value);
  }
}

function populateDriveTypes() {
  const noDrive = new Option(textFor('drive.none'), NO_DRIVE);
  driveTypeSelect.replaceChildren(noDrive, ...driveTypes.map(toTranslatedOption('drive')));
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
    usages: readTickedUsages(),
  };
}

let engravingFont = null;
let hasFontLoadingFailed = false;
let previewedLabel = null;

function buildImageUrl(formFields) {
  const url = new URL(location.href);
  url.search = `mode=image&${buildLabelFieldsQuery(formFields)}`;
  return url.href;
}

function showImageUrl(formFields) {
  imageUrlInput.value = buildImageUrl(formFields);
}

function hideImageUrl() {
  imageUrlInput.value = '';
}

function rememberPreviewedLabel(label) {
  previewedLabel = label;
  downloadButton.disabled = false;
}

function forgetPreviewedLabel() {
  previewedLabel = null;
  downloadButton.disabled = true;
  hideImageUrl();
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
  return hasDetailsTooSmallToEngrave(spec, engravingFont) ? textFor('notice.smallDetails') : '';
}

function previewLabel(spec, formFields) {
  rememberPreviewedLabel({ svg: renderLabel(spec, engravingFont), fileName: buildFileName(spec, language) });
  showImageUrl(formFields);
  preview.innerHTML = previewedLabel.svg;
  preview.classList.remove('is-outdated');
  showMessages({ status: smallDetailsWarningFor(spec) });
}

function clearPreview() {
  forgetPreviewedLabel();
  preview.replaceChildren();
}

function explainInvalidField(error) {
  forgetPreviewedLabel();
  preview.classList.add('is-outdated');
  showMessages({ error: describeLabelSpecError(language, error) });
}

function explainUnexpectedError(error) {
  clearPreview();
  showMessages({ error: textFor('notice.unexpectedError') });
  throw error;
}

function refreshPreview() {
  try {
    const formFields = readFormFields();
    previewLabel(readLabelSpec(formFields, engravingFont), formFields);
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
  hasFontLoadingFailed = true;
  showFontLoadingState();
  throw error;
}

function showFontLoadingState() {
  if (hasFontLoadingFailed) {
    showMessages({ error: textFor('notice.fontLoadingFailure') });
  } else {
    showMessages({ status: textFor('notice.fontLoading') });
  }
}

function refreshMessagesAndPreview() {
  if (engravingFont) {
    refreshPreview();
  } else {
    showFontLoadingState();
  }
}

function populateChoices() {
  repopulateKeepingChoice(hardwareTypeSelect, populateHardwareTypes);
  populateUsages();
  repopulateKeepingChoice(driveTypeSelect, populateDriveTypes);
}

function changeLanguage() {
  language = languageSelect.value;
  translateStaticTexts();
  populateChoices();
  refreshMessagesAndPreview();
  storeLanguage(localStorage, language);
}

populateLanguages();
translateStaticTexts();
populateChoices();
populateDriveSizes();
showDriveFieldsOnlyForHardwareWithDrive();
showFontLoadingState();
languageSelect.addEventListener('input', changeLanguage);
hardwareTypeSelect.addEventListener('input', showDriveFieldsOnlyForHardwareWithDrive);
driveTypeSelect.addEventListener('input', populateDriveSizes);
downloadButton.addEventListener('click', downloadPreviewedLabel);
loadEngravingFont().then(startPreviewingWith, explainFontLoadingFailure);
