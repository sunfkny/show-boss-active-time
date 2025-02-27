<script setup lang="ts">
import type { JobCardComponent } from './utils/element';
import { GM_getValue, GM_setValue } from '$';
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { isJobCardComponent } from './utils/element';
import { parseActiveTimeDesc } from './utils/parse';

interface BlackRule {
  activeDayGreater: number;
  brandNameContains: string[];
  jobNameContains: string[];
}

const blackRules = ref<BlackRule>({
  activeDayGreater: 7,
  brandNameContains: [],
  jobNameContains: [],
});

const blackRulesKey = 'blackRules';

onMounted(() => {
  blackRules.value = GM_getValue<BlackRule>(blackRulesKey, {
    activeDayGreater: 7,
    brandNameContains: [],
    jobNameContains: [],
  });
});

watch(() => blackRules.value, (newValue) => {
  GM_setValue(blackRulesKey, newValue);
}, { deep: true });

function removeBrandName(brandName: string) {
  const c = confirm(`确定要删除 ${brandName} 吗？`);
  if (!c)
    return;
  blackRules.value.brandNameContains = blackRules.value.brandNameContains.filter(
    item => item !== brandName,
  );
}
function removeJobName(jobName: string) {
  const c = confirm(`确定要删除 ${jobName} 吗？`);
  if (!c)
    return;
  blackRules.value.jobNameContains = blackRules.value.jobNameContains.filter(
    item => item !== jobName,
  );
}
const brandNameInput = ref('');
const jobNameInput = ref('');
function addBrandName() {
  if (blackRules.value.brandNameContains.includes(brandNameInput.value)) {
    brandNameInput.value = '';
    alert('品牌名称已在黑名单中');
    return;
  }
  if (brandNameInput.value) {
    blackRules.value.brandNameContains.push(brandNameInput.value);
    brandNameInput.value = '';
  }
}
function addJobName() {
  if (blackRules.value.jobNameContains.includes(jobNameInput.value)) {
    jobNameInput.value = '';
    alert('职位名称已在黑名单中');
    return;
  }
  if (jobNameInput.value) {
    blackRules.value.jobNameContains.push(jobNameInput.value);
    jobNameInput.value = '';
  }
}

function setStyle(ele: JobCardComponent & HTMLElement) {
  if (!ele.__vue__.jobCard)
    return;
  if (!ele.__vue__.data)
    return;

  const activeTimeDesc = ele.__vue__.jobCard.activeTimeDesc;
  const activeTimeDay = parseActiveTimeDesc(activeTimeDesc);

  console.log({
    ele,
    jobName: ele.__vue__.data.jobName,
    activeTimeDesc,
    activeTimeDay,
  });

  if (
    activeTimeDay
    > blackRules.value.activeDayGreater
  ) {
    ele.style.display = 'none';
  }
  else if (
    blackRules.value.brandNameContains.some(item =>
      ele.__vue__.data?.brandName.includes(item),
    )
  ) {
    ele.style.display = 'none';
  }
  else if (
    blackRules.value.jobNameContains.some(item =>
      ele.__vue__.data?.jobName.includes(item),
    )
  ) {
    ele.style.display = 'none';
  }
  else {
    ele.style.display = 'list-item';
  }
}

async function handleJobCardWrapperUpdate(ele: Element) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  if (!isJobCardComponent(ele))
    return;
  if (!ele.__vue__.data?.jobName)
    return;
  let loadedJobCard = false;
  if (!ele.__vue__.jobCard) {
    await ele.__vue__.getJobCard();
    loadedJobCard = true;
  }
  if (!ele.__vue__.jobCard)
    return;
  if (loadedJobCard) {
    const activeTimeDesc = ele.__vue__.jobCard!.activeTimeDesc;
    const hasAddActiveTimeDesc = ele.__vue__.data.skills.includes(activeTimeDesc);
    if (!hasAddActiveTimeDesc) {
      ele.__vue__.data.skills.unshift(activeTimeDesc);
    }
    setStyle(ele);
  }
}

function debounce<T extends Function>(cb: T, wait: number) {
  let h = 0;
  let callable = (...args: any) => {
    clearTimeout(h);
    h = setTimeout(() => cb(...args), wait);
  };
  return <T>(<any>callable);
}

async function handleJobListWrapperUpdate(ele: HTMLElement) {
  let jobCards;
  while (true) {
    jobCards = ele.querySelectorAll('.job-card-wrapper');
    if (jobCards.length >= 0) {
      break;
    }
    console.log('waiting for job-card-wrapper');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  for (const jobCard of jobCards) {
    handleJobCardWrapperUpdate(jobCard);
  }
}

let mutationObserver = ref<MutationObserver | null>(null);
onMounted(() => {
  mutationObserver.value = new MutationObserver((mutationsList) => {
    for (let mutation of mutationsList) {
      const target = mutation.target;
      if (target instanceof HTMLElement) {
        if (target.classList.contains('job-list-wrapper') || target.classList.contains('search-job-result')) {
          debounce(handleJobListWrapperUpdate, 1000)(target);
        }
      }
    }
  });
  mutationObserver.value.observe(document.body, {
    childList: true,
    subtree: true,
  });
});
onUnmounted(() => {
  mutationObserver.value?.disconnect();
});
</script>

<template>
  <div class="container">
    <div class="card">
      <div class="title">
        隐藏活跃天数大于
      </div>
      <input v-model="blackRules.activeDayGreater" type="number">
    </div>

    <div class="card">
      <div class="title">
        隐藏品牌名称
      </div>
      <div class="tags">
        <div v-for="item in blackRules.brandNameContains">
          <div class="tag pointer" @click="removeBrandName(item)">
            {{ item }}
          </div>
        </div>
      </div>

      <input v-model="brandNameInput" type="text" @keydown.enter="addBrandName"></input>
    </div>

    <div class="card">
      <div class="title">
        隐藏职位名称
      </div>
      <div class="tags">
        <div v-for="item in blackRules.jobNameContains">
          <div class="tag pointer" @click="removeJobName(item)">
            {{ item }}
          </div>
        </div>
      </div>

      <input v-model="jobNameInput" type="text" @keydown.enter="addJobName"></input>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  width: 180px;
}

input {
  outline-style: none;
  border: 1px solid #c0c4cc;
  border-radius: 5px;
  padding: 4px 8px;
  margin: 4px;
  width: calc(100% - 8px) !important;

  &:focus {
    border-color: #00BEBD;
    outline: 0;
    box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075),
      #00BEBD;
    -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075),
      #00BEBD;
  }
}

.pointer {
  cursor: pointer;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 4px;
}

.tags .tag {
  border-radius: 4px;
  border: 1px solid #ccc;
  padding: 2px 4px;

  &:hover {
    border-color: #00BEBD;
    color: #00BEBD;
  }
}

.title {
  font-size: 16px;
  font-weight: 700;
  margin: 4px;
}

.card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
  padding: 4px;
  margin: 4px;
}
</style>
