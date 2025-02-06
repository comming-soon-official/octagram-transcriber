var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var ffmpeg = require('fluent-ffmpeg');
var join = require('path').join;
var path = require('path');
var existsSync = require('fs').existsSync;
function detectSilence(audioFile) {
    return __awaiter(this, void 0, void 0, function () {
        var silenceSegments;
        return __generator(this, function (_a) {
            console.log("[detectSilence] Starting silence detection for ".concat(audioFile));
            silenceSegments = [];
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    console.log("[detectSilence] Initializing FFmpeg process");
                    ffmpeg(audioFile)
                        .audioFilters('silencedetect=noise=-30dB:d=0.5')
                        .output('pipe:') // Add null output to prevent the "No output specified" error
                        .format('null')
                        .on('start', function (commandLine) {
                        console.log("[detectSilence] FFmpeg command: ".concat(commandLine));
                    })
                        .on('stderr', function (stderrLine) {
                        console.log("[detectSilence] FFmpeg stderr: ".concat(stderrLine));
                        var silenceStartMatch = stderrLine.match(/silence_start: ([\d\.]+)/);
                        var silenceEndMatch = stderrLine.match(/silence_end: ([\d\.]+)/);
                        var silenceDurationMatch = stderrLine.match(/silence_duration: ([\d\.]+)/);
                        if (silenceStartMatch &&
                            silenceEndMatch &&
                            silenceDurationMatch) {
                            var segment = {
                                start: parseFloat(silenceStartMatch[1]),
                                end: parseFloat(silenceEndMatch[1]),
                                duration: parseFloat(silenceDurationMatch[1])
                            };
                            console.log("[detectSilence] Found silence segment:", segment);
                            silenceSegments.push(segment);
                        }
                    })
                        .on('end', function () {
                        console.log("[detectSilence] Completed silence detection, found ".concat(silenceSegments.length, " segments"));
                        resolve(silenceSegments);
                    })
                        .on('error', function (err) {
                        console.error("[detectSilence] Error:", err);
                        reject(err);
                    })
                        .run();
                })];
        });
    });
}
function validateAudioFile(filePath) {
    if (!existsSync(filePath)) {
        throw new Error("Audio file not found: ".concat(filePath));
    }
    // Get absolute path
    var absolutePath = path.resolve(filePath);
    return true;
}
function mergeAudioFiles(audio1, audio2, outputPath) {
    return __awaiter(this, void 0, void 0, function () {
        var audio1Path_1, audio2Path_1, outputAbsPath, silence1_1, silence2_1, outputFile_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    // Validate files first
                    validateAudioFile(audio1);
                    validateAudioFile(audio2);
                    audio1Path_1 = path.resolve(audio1);
                    audio2Path_1 = path.resolve(audio2);
                    outputAbsPath = path.resolve(outputPath);
                    console.log("[mergeAudioFiles] Starting merge operation");
                    console.log("[mergeAudioFiles] Audio1: ".concat(audio1Path_1));
                    console.log("[mergeAudioFiles] Audio2: ".concat(audio2Path_1));
                    console.log("[mergeAudioFiles] Output path: ".concat(outputAbsPath));
                    console.log("[mergeAudioFiles] Detecting silence in first audio file");
                    return [4 /*yield*/, detectSilence(audio1Path_1)];
                case 1:
                    silence1_1 = _a.sent();
                    console.log("[mergeAudioFiles] Detecting silence in second audio file");
                    return [4 /*yield*/, detectSilence(audio2Path_1)];
                case 2:
                    silence2_1 = _a.sent();
                    outputFile_1 = join(outputAbsPath, 'merged.wav');
                    console.log("[mergeAudioFiles] Output file will be: ".concat(outputFile_1));
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            console.log("[mergeAudioFiles] Starting FFmpeg merge process");
                            ffmpeg()
                                .input(audio1Path_1)
                                .input(audio2Path_1)
                                .on('start', function (commandLine) {
                                console.log("[mergeAudioFiles] FFmpeg command: ".concat(commandLine));
                            })
                                .complexFilter([
                                '[0:a]silenceremove=stop_periods=-1:stop_duration=0.5:stop_threshold=-30dB[a1]',
                                '[1:a]silenceremove=stop_periods=-1:stop_duration=0.5:stop_threshold=-30dB[a2]',
                                '[a1][a2]concat=n=2:v=0:a=1[out]'
                            ], ['out'])
                                .output(outputFile_1)
                                .on('progress', function (progress) {
                                console.log("[mergeAudioFiles] Processing: ".concat(JSON.stringify(progress)));
                            })
                                .on('end', function () {
                                console.log("[mergeAudioFiles] Merge completed successfully");
                                resolve({
                                    outputFile: outputFile_1,
                                    silenceSegments: __spreadArray(__spreadArray([], silence1_1, true), silence2_1, true)
                                });
                            })
                                .on('error', function (err) {
                                console.error("[mergeAudioFiles] Error during merge:", err);
                                reject(err);
                            })
                                .run();
                        })];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error in mergeAudioFiles:', error_1);
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var result, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("[main] Starting audio processing");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, mergeAudioFiles('./1.wav', './2.wav', './')];
                case 2:
                    result = _a.sent();
                    console.log("[main] Merge completed successfully");
                    console.log("[main] Merged audio saved to: ".concat(result.outputFile));
                    console.log("[main] Silence segments detected: ".concat(result.silenceSegments.length));
                    result.silenceSegments.forEach(function (segment, i) {
                        console.log("[main] Segment ".concat(i + 1, ":"));
                        console.log("[main]   Start: ".concat(segment.start, "s"));
                        console.log("[main]   End: ".concat(segment.end, "s"));
                        console.log("[main]   Duration: ".concat(segment.duration, "s"));
                    });
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error("[main] Fatal error:", error_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
main();
