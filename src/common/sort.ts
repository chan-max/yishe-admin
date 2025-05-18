

export const sortTypeOptions = [
    {
        label: '按创建时间降序',
        value: 1,
        postValue:[{field:'create_time',order:'desc'}],
    },
    {
        label: '按创建时间升序',
        value: 11,
        postValue:[{field:'create_time',order:'asc'}],
    },
    {
        label: '按更新时间降序',
        value: 2,
        postValue:[{field:'update_time',order:'desc'}],
    },
    {
        label: '按更新时间升序',
        value: 12,
        postValue:[{field:'update_time',order:'asc'}],
    },
]

sortTypeOptions.forEach((item) => {
    item.value = JSON.stringify(item.postValue)
})

export function defaultSortingValue(){
    return sortTypeOptions[0].value
}