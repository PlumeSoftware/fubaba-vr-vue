function aMidInB(a: HTMLElement, b: HTMLElement): boolean {
  //判断a的中心是否在b中
  const aPos = a.getBoundingClientRect();
  const bPos = b.getBoundingClientRect();
  const aMiddleX = aPos.left + aPos.width / 2;
  const aMiddleY = aPos.top + aPos.height / 2;
  if (
    aMiddleX >= bPos.left &&
    aMiddleX <= bPos.left + bPos.width &&
    aMiddleY >= bPos.top &&
    aMiddleY <= bPos.top + bPos.height
  )
    return true;
  return false;
}
function aRelativeB(a: HTMLElement, b: HTMLElement): "right" | "left" {
  //判断a相对于b的位置
  const aPos = a.getBoundingClientRect();
  const bPos = b.getBoundingClientRect();
  const aMiddleX = aPos.left + aPos.width / 2;
  const bMiddleX = bPos.left + bPos.width / 2;
  if (aMiddleX <= bMiddleX) return "left";
  return "right";
}
export { aMidInB, aRelativeB };
