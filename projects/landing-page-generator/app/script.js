const productNameInput = document.querySelector('#product-name');
const taglineInput = document.querySelector('#tagline');
const featureInputs = Array.from(document.querySelectorAll('.feature-input'));

const previewBrand = document.querySelector('#preview-brand');
const previewName = document.querySelector('#preview-name');
const previewTagline = document.querySelector('#preview-tagline');
const previewFeatureList = document.querySelector('#preview-feature-list');

const fallback = {
  productName: 'Your Product',
  tagline: 'A clear, compelling tagline for your next launch.',
  features: [
    'Fast setup for busy teams',
    'Simple workflows that stay organized',
    'Helpful insights when you need them'
  ]
};

function cleanValue(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function getGeneratorState() {
  const productName = cleanValue(productNameInput.value) || fallback.productName;
  const tagline = cleanValue(taglineInput.value) || fallback.tagline;
  const features = featureInputs
    .map((input) => cleanValue(input.value))
    .filter(Boolean)
    .slice(0, 5);

  return {
    productName,
    tagline,
    features: features.length >= 3 ? features : fallback.features
  };
}

function createFeatureCard(feature, index) {
  const card = document.createElement('article');
  card.className = 'feature-card';

  const icon = document.createElement('div');
  icon.className = 'feature-icon';
  icon.textContent = String(index + 1);

  const title = document.createElement('h4');
  title.textContent = feature;

  card.append(icon, title);
  return card;
}

function renderPreview() {
  const state = getGeneratorState();

  previewBrand.textContent = state.productName;
  previewName.textContent = state.productName;
  previewTagline.textContent = state.tagline;

  previewFeatureList.replaceChildren();

  if (!state.features.length) {
    const emptyState = document.createElement('p');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'Add at least three features to shape the preview.';
    previewFeatureList.append(emptyState);
    return;
  }

  state.features.forEach((feature, index) => {
    previewFeatureList.append(createFeatureCard(feature, index));
  });
}

[productNameInput, taglineInput, ...featureInputs].forEach((input) => {
  input.addEventListener('input', renderPreview);
});

renderPreview();
