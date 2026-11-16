export function isConfidentlyInside(distance,accuracy,radius){
 return Number.isFinite(distance)&&Number.isFinite(accuracy)&&accuracy>0&&Number.isFinite(radius)&&radius>0&&distance+accuracy<=radius;
}
