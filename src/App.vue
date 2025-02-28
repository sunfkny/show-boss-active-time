<script setup lang="ts">
import type { JobCardComponent } from './utils/element';
import { GM_getValue, GM_setValue } from '$';
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { isJobCardComponent } from './utils/element';
import { parseActiveTimeDesc } from './utils/parse';

interface BlackRule {
  enableGetJobCard: boolean;
  activeDayGreater: number;
  brandNameContains: string[];
  jobNameContains: string[];
}

const blackRules = ref<BlackRule>({
  enableGetJobCard: false,
  activeDayGreater: 7,
  brandNameContains: [],
  jobNameContains: [],
});

const blackRulesKey = 'blackRules';

onMounted(() => {
  blackRules.value = GM_getValue<BlackRule>(blackRulesKey, {
    enableGetJobCard: false,
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

function hideByName({ ele, brandName, jobName }: {
  ele: HTMLElement,
  brandName: string,
  jobName: string,
}) {

  if (
    blackRules.value.brandNameContains.some(item => brandName.includes(item))
  ) {
    ele.style.display = 'none';
    return true;
  }
  else if (
    blackRules.value.jobNameContains.some(item => jobName.includes(item))
  ) {
    ele.style.display = 'none';
    return true;
  }
  else {
    return false;
  }
}

async function hideByActivateTime(ele: JobCardComponent & HTMLElement) {
  if (!isJobCardComponent(ele)) return;
  if (!ele.__vue__) return;
  if (!ele.__vue__.data) return;

  const brandName = ele.__vue__.data.brandName;
  const jobName = ele.__vue__.data.jobName;
  const encryptJobId = ele.__vue__.data.encryptJobId;
  const jobCardCacheKey = `jobCard:encryptJobId:${encryptJobId}`;
  const cachedJobCard = sessionStorage.getItem(jobCardCacheKey);
  try {
    if (cachedJobCard) {
      ele.__vue__.jobCard = JSON.parse(cachedJobCard);
      console.log('getJobCard cache hit', { brandName, jobName, ele });
    } else {
      console.log('getJobCard cache miss', { brandName, jobName, ele });
    }
  } catch (error) {
    console.error(error);
  }
  if (!ele.__vue__.jobCard) {
    const sleepTime = Math.random() * 1000 + 1000;
    await new Promise(resolve => setTimeout(resolve, sleepTime));
    try {
      if (ele.__vue__.getJobCard) {
        await ele.__vue__.getJobCard();
        getJobCardApiCount.value += 1;
      }
    } catch (error) {
      console.error(error);
    }
  }
  if (!ele.__vue__.jobCard) return;

  const activeTimeDesc = ele.__vue__.jobCard.activeTimeDesc;
  const hasAddActiveTimeDesc = ele.__vue__.data.skills.includes(activeTimeDesc);
  sessionStorage.setItem(jobCardCacheKey, JSON.stringify(ele.__vue__.jobCard));
  if (!hasAddActiveTimeDesc) {
    ele.__vue__.data.skills.unshift(activeTimeDesc);
  }
  const activeTimeDay = parseActiveTimeDesc(activeTimeDesc);
  if (
    activeTimeDay
    > blackRules.value.activeDayGreater
  ) {
    ele.style.display = 'none';
    return true;
  } else {
    return false;
  }
}

function showElement({ ele }: { ele: HTMLElement; }) {
  ele.style.display = 'list-item';
}

async function handleJobCardWrapperUpdate(ele: Element) {
  if (!isJobCardComponent(ele)) return;
  if (!ele.__vue__) return;
  if (!ele.__vue__.data) return;

  const brandName = ele.__vue__.data.brandName;
  const jobName = ele.__vue__.data.jobName;

  const isHideByName = hideByName({ ele, brandName, jobName });
  if (isHideByName) return;

  if (blackRules.value.enableGetJobCard) {
    const isHideByActivateTime = await hideByActivateTime(ele);
    if (isHideByActivateTime) return;
  }

  showElement({ ele });
}

function triggerJobListWrapperUpdate() {
  const result: HTMLDivElement | null = document.querySelector('.search-job-result');
  console.log({ result });
  if (result) {
    handleJobListWrapperUpdate(result);
  }
}

const mutex = ref(false);

async function handleJobListWrapperUpdate(ele: HTMLElement) {
  if (mutex.value) {
    console.warn('mutex locked return');
    return;
  }
  mutex.value = true;
  console.log('mutex locked');

  let jobCards;
  let maxTryCount = 10;
  while (maxTryCount--) {
    jobCards = ele.querySelectorAll('.job-card-wrapper');
    if (jobCards.length > 0) {
      console.log('job-card-wrapper found', jobCards.length);
      break;
    }
    console.log('waiting for job-card-wrapper');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (jobCards) {
    for (const jobCard of jobCards) {
      await handleJobCardWrapperUpdate(jobCard);
    }
  }
  mutex.value = false;
  console.log('mutex unlocked');
}

let mutationObserver = ref<MutationObserver | null>(null);
onMounted(() => {
  mutationObserver.value = new MutationObserver((mutationsList) => {
    for (let mutation of mutationsList) {
      const target = mutation.target;
      if (target instanceof HTMLElement) {
        if (target.classList.contains('job-list-wrapper') || target.classList.contains('search-job-result')) {
          if (mutex.value) {
            continue;
          }
          handleJobListWrapperUpdate(target);
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

const getJobCardApiCount = ref(0);
</script>

<template>
  <div class="container">
    <div class="card">
      <div>
        <div style="display: flex; align-items: center;">
          <span class="title">隐藏活跃天数大于</span>
          <div>开启</div>
          <input v-model="blackRules.enableGetJobCard" type="checkbox"></input>
        </div>
      </div>
      <input :disabled="!blackRules.enableGetJobCard" v-model="blackRules.activeDayGreater" type="number">
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

    <button @click="triggerJobListWrapperUpdate">手动触发</button>

    <div class="card">
      <div>请求次数 {{ getJobCardApiCount }}</div>
      <div>加载中 {{ mutex }}</div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  width: min-content;
}

input {
  outline-style: none;
  border: 1px solid #c0c4cc;
  border-radius: 5px;
  padding: 4px 8px;
  margin: 4px;

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

button {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
  padding: 4px;
  margin: 4px;

  &:hover {
    border-color: #00BEBD;
    color: #00BEBD;
  }
}
</style>
