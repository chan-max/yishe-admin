import request from "@/config/axios";

export function getCodeScriptScheduleList(data) {
  return request.post({
    url: "/code-script/schedule/page",
    data,
  });
}

export function getCodeScriptSchedule(id: number | string) {
  return request.get({
    url: `/code-script/schedule/get?id=${id}`,
  });
}

export function createCodeScriptSchedule(data) {
  return request.post({
    url: "/code-script/schedule/create",
    data,
  });
}

export function updateCodeScriptSchedule(data) {
  return request.put({
    url: "/code-script/schedule/update",
    data,
  });
}

export function deleteCodeScriptSchedule(data) {
  return request.delete({
    url: "/code-script/schedule/delete",
    data,
  });
}

export function toggleCodeScriptSchedule(data) {
  return request.post({
    url: "/code-script/schedule/toggle",
    data,
  });
}

export function runNowCodeScriptSchedule(data) {
  return request.post({
    url: "/code-script/schedule/run-now",
    data,
  });
}

export function getCodeScriptScheduleExecutionList(data) {
  return request.post({
    url: "/code-script/schedule/execution/page",
    data,
  });
}

export function getCodeScriptScheduleExecution(id: number | string) {
  return request.get({
    url: `/code-script/schedule/execution/get?id=${id}`,
  });
}
