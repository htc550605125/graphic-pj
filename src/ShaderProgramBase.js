"use strict";

import { gl } from './GLContext'
import * as Utils from './Utils'

let currentProgram = null;

export class ShaderProgramBase {

  constructor(args, shaders) {
    this.program = gl.createProgram();

    shaders.forEach((shader) => gl.attachShader(this.program, shader));

    gl.linkProgram(this.program);
    let linked = gl.getProgramParameter(this.program, gl.LINK_STATUS);
    if (!linked) {
      let error = gl.getProgramInfoLog(this.program);
      console.log('Failed to link program: ' + error);
      gl.deleteProgram(this.program);
      gl.deleteShader(vShader);
      gl.deleteShader(fShader);
      throw error;
    }

    this.args = {};

    this.vaArgsTotalLen = this.loadShaderArgLocation(args);
    this.vaArgs = args.filter((arg) => arg.name[0] == 'a');
  }

  loadShaderArgLocation(args) {
    let size = 0;

    for (let arg of args) {
      Utils.extend(arg, {
        length: 0,
        size: 0,
        type: gl.FLOAT,
        normalized: false
      });

      let position = -1;
      switch (arg.name[0]) {
        case 'u':
          position = gl.getUniformLocation(this.program, arg.name);
          break;

        case 'a':
          position = gl.getAttribLocation(this.program, arg.name);
          arg.offset = size;
          size += arg.size;
          break;

        default:
          throw "Unknown shader argument type " + arg.name;
      }

      arg.position = position;
      this.args[arg.name] = position;

      if (position < 0) {
        console.log('WARN: ArgPosition of ' + arg.name + ' is ' + position);
      }
    }

    return size;
  }

  loadProgram() {
    if (currentProgram == this.program) {
      return;
    }
    gl.useProgram(this.program);
    currentProgram = this.program;
  }

  loadVaArgs() {
    for (let arg of this.vaArgs) {
      gl.vertexAttribPointer(arg.position, arg.length, arg.type, arg.normalized,
          this.vaArgsTotalLen, arg.offset);
      gl.enableVertexAttribArray(arg.position);
    }
  }

  static initShader(type, source) {
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    let compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
      var error = gl.getShaderInfoLog(shader);
      console.log('Failed to compile shader: ' + error);
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
}
