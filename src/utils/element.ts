export type JobCardComponent = {
  __vue__: {
    getJobCard: () => void;
    jobCard: {
      activeTimeDesc: string;
    } | null;
    data: {
      jobName: string;
      bossName: string;
      brandName: string;
      skills: string[];
    } | null;
  };
};

export function isJobCardComponent(
  jobCard: any
): jobCard is JobCardComponent & HTMLElement {
  try {
    return jobCard.__vue__.$vnode.tag.endsWith("JobCard");
  } catch (e) {
    return false;
  }
}
