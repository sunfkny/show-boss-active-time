type JobCardComponent = {
  __vue__: {
    getJobCard: () => void;
    jobCard: {
      activeTimeDesc: string;
    } | null;
    data: {
      jobName: string;
      bossName: string;
      skills: string[];
    } | null;
  };
};

function isJobCardComponent(
  jobCard: any
): jobCard is JobCardComponent & HTMLElement {
  try {
    return jobCard.__vue__.$vnode.tag.endsWith("JobCard");
  } catch (e) {
    return false;
  }
}

function parseActiveTimeDesc(activeTimeDesc: string): number {
  const regex = /(\d+)(日|月|周|天|半年|年)(内活跃|活跃|前活跃|前)/;
  const match = activeTimeDesc.match(regex);

  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case "月":
        return value * 30;
      case "周":
        return value * 7;
      case "天":
        return value;
      case "日":
        return value;
      case "半年":
        return 180;
      case "年":
        return 365;
      default:
        return -1;
    }
  }

  switch (activeTimeDesc) {
    case "近半年活跃":
      return 180;
    case "半年前活跃":
      return 180;
    case "本月活跃":
      return 30;
    case "本周活跃":
      return 7;
    case "今日活跃":
      return 1;
    case "刚刚活跃":
      return 0;
    default:
      return -1;
  }
}

function setStyle(ele: HTMLElement, value: number) {
  const maxDays = 14;
  const maxOpacity = 0.1;
  if (value === -1) {
    ele.style.backgroundColor = "rgba(255, 0, 0, 0.5)";
  }
  if (value > maxDays) {
    ele.style.opacity = String(maxOpacity);
  }
  if (value >= 0 && value <= maxDays) {
    ele.style.opacity = String(
      1 - (value / maxDays) * (1 - maxOpacity) + maxOpacity
    );
  }
}

async function main() {
  const jobCards = document.querySelectorAll(".job-card-wrapper");

  const targetPath = "/web/geek/job";
  if (window.location.pathname != targetPath) {
    window.location.href = targetPath;
  }

  console.log({ jobCards });
  for (const ele of jobCards) {
    if (!isJobCardComponent(ele)) return;
    if (!ele.__vue__.data?.jobName) return;
    if (!ele.__vue__.jobCard) {
      await ele.__vue__.getJobCard();
    }
    if (!ele.__vue__.jobCard) {
      console.error("无法获取活动职位卡片", ele);
      return;
    }
    const activeTimeDesc = ele.__vue__.jobCard.activeTimeDesc;
    const activeTimeDay = parseActiveTimeDesc(activeTimeDesc);
    if (activeTimeDay === -1) {
      console.error("无法解析活动时间描述", activeTimeDesc);
      return;
    }
    console.log({
      ele,
      jobName: ele.__vue__.data.jobName,
      activeTimeDesc,
      activeTimeDay,
    });
    ele.__vue__.data.skills.unshift(activeTimeDesc);
    setStyle(ele, activeTimeDay);
  }
}
const btn = document.createElement("button");
btn.innerText = "加载活跃时间";
btn.style.position = "fixed";
btn.style.borderRadius = "8px";
btn.style.bottom = "8px";
btn.style.right = "8px";
btn.style.padding = "4px";
btn.style.zIndex = "9999";
btn.addEventListener("click", async () => {
  btn.disabled = true;
  try {
    await main();
  } catch (e) {
    console.error(e);
  } finally {
    btn.disabled = false;
  }
});
document.body.appendChild(btn);
