export function parseActiveTimeDesc(activeTimeDesc: string): number {
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
  