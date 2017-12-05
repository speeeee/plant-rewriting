var vss = `#version 300 es
in vec4 a_pos;
uniform vec4 u_disp;

uniform mat4 u_model; uniform mat4 u_view; uniform mat4 u_proj;

void main() { gl_Position = u_proj*u_view*u_model*(a_pos+u_disp); }
`;

var fss = `#version 300 es
precision mediump float;
out vec4 outc;

void main() {
  outc = vec4(1,0,0.5,1); }
`;

function createShader(gl, type, sc) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader,sc);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if(success) { return shader; }
  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader); }

function createProgram(gl,vs,fs) {
  var program = gl.createProgram();
  gl.attachShader(program,vs); gl.attachShader(program,fs);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program,gl.LINK_STATUS);
  if(success) { return program; }
  console.log(gl.getProgramInfoLog(program)); gl.deleteProgram(program); }

function frustum_pers(left, right, bottom, topl, near, far) {
  return mat4.fromValues(2*near/(right-left),0,(right+left)/(right-left),0
                        ,0,2*near/(topl-bottom),(topl+bottom)/(topl-bottom),0
                        ,0,0,-(far+near)/(far-near),-2*far*near/(far-near)
                        ,0,0,-1,0); }

function resize(canvas,perspective) {
  var disp_width = canvas.clientWidth;
  var disp_height = canvas.clientHeight;
  if(disp_width!=canvas.width||disp_height!=canvas.height) { canvas.width = disp_width; canvas.height = disp_height;
    var ratio = canvas.width/canvas.height;
    perspective = frustum_pers(-ratio,ratio,-1,1,1,500); } }

// draw //
function draw(perspective) {
  resize(gl.canvas,perspective);

  gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
  gl.useProgram(program);
  gl.clearColor(0,0,0,0);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

  gl.bindVertexArray(vao);

  gl.drawArrays(gl.TRIANGLES,0,3); }

// TODO: make javascript parsing of string to drawing (3D)
// main //
var canvas = document.getElementById("c");
var gl = canvas.getContext("webgl2");

gl.enable(gl.DEPTH_TEST);

var model = mat4.create();
//var view = [1,0,0,0, 0,1,0,0, 0,0,1,-2.5, 0,0,0,1];
var view = mat4.create(); mat4.fromTranslation(view,vec3.fromValues(0,0,-2.5));
console.log(view);
var ratio = gl.canvas.clientWidth/gl.canvas.clientHeight;
var perspective = frustum_pers(-ratio,ratio,-1,1,1,500);

var vs = createShader(gl,gl.VERTEX_SHADER,vss);
var fs = createShader(gl,gl.FRAGMENT_SHADER,fss);
var program = createProgram(gl,vs,fs);

var pos_attrib = gl.getAttribLocation(program, "a_pos");
var pos_buf = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, pos_buf);

var pos = [0,0,0, 0,0.5,0, 0.7,0,0];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);

var vao = gl.createVertexArray();
gl.bindVertexArray(vao);
gl.enableVertexAttribArray(pos_attrib);

gl.vertexAttribPointer(pos_attrib,3,gl.FLOAT,false,0,0);

gl.useProgram(program);

var disp_loc = gl.getUniformLocation(program,"u_disp");
var model_loc = gl.getUniformLocation(program,"u_model");
gl.uniformMatrix4fv(model_loc,true,model);
var view_loc = gl.getUniformLocation(program,"u_view");
gl.uniformMatrix4fv(view_loc,false,view);
var proj_loc = gl.getUniformLocation(program,"u_proj");
gl.uniformMatrix4fv(proj_loc,true,perspective);
gl.uniform4f(disp_loc,0,0,0,1);

draw(perspective);

// controls //
var omx = 0; var omy = 0;
var camera = { tht: 0, phi: 0 };
canvas.addEventListener("mousemove", function(evt) {
  if(omx==0&&omy==0||evt.buttons!=1) { omx = evt.clientX; omy = evt.clientY; return; }
  else { var nm = { x: evt.clientX - omx, y: evt.clientY - omy };
    camera = { tht: camera.tht+nm.x*0.001, phi: camera.phi+nm.y*0.001 };
    //gl.uniform4f(disp_loc,camera.x,camera.y,0,1);
    var a = mat4.create(); var b = mat4.create(); mat4.fromRotation(a,nm.x*0.01,vec3.fromValues(0,1,0));
    mat4.fromRotation(b,nm.y*0.01,vec3.fromValues(1,0,0)); mat4.multiply(a,a,b);
    mat4.multiply(model,a,model);
    gl.uniformMatrix4fv(model_loc,true,model);
    omx = evt.clientX; omy = evt.clientY; draw(perspective); } });
