mat4 = {
frustum_pers: function(left, right, bottom, topl, near, far) {
  return [2*near/(right-left),0,(right+left)/(right-left),0
         ,0,2*near/(topl-bottom),(topl+bottom)/(topl-bottom),0
         ,0,0,-(far+near)/(far-near),-2*far*near/(far-near)
         ,0,0,-1,0]; },

// square-matrix multiply
smul: function(mata,matb,sz) { var ret = Array(sz*sz).fill(0);
  for(var i=0;i<ret.length;i++) {
    for(var j=0;j<sz;j++) { ret[i] += mata[j+Math.floor(i/sz)*sz]*matb[j*sz+i%sz]; } }
  return ret; },

// angle in radians
rotate: function(angle,x,y,z) {
  var c = Math.cos(angle); var s = Math.sin(angle);
  return [x*x*(1-c)+c,   x*y*(1-c)-z*s, x*z*(1-c)+y*s, 0
         ,y*x*(1-c)+z*s, y*y*(1-c)+c,   y*z*(1-c)-x*z, 0
         ,x*z*(1-c)-y*s, y*z*(1-c)+x*s, z*z*(1-c)+c,   0
         ,0,             0,             0,             1]; },

translate: function(x,y,z) {
  return [1,0,0,x, 0,1,0,y, 0,0,1,z, 0,0,0,1]; } };
