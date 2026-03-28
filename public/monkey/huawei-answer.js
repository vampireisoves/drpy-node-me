function extractExamContentWithNumbers() {
    const examContents = document.querySelectorAll('.exam-content');
    let allText = '';
    const totalQuestions = examContents.length;

    examContents.forEach((content, index) => {
        const questionNumber = index + 1;
        let questionType = '';

        // 根据题目总数确定题型分配规则
        if (totalQuestions === 24) {
            // 24题模式：5道判断+10道单选+9道多选
            if (questionNumber >= 1 && questionNumber <= 5) {
                questionType = '判断题';
            } else if (questionNumber >= 6 && questionNumber <= 15) {
                questionType = '单选题';
            } else if (questionNumber >= 16 && questionNumber <= 24) {
                questionType = '多选题';
            }
        } else if (totalQuestions === 50) {
            // 50题模式：15道判断+20道单选+15道多选
            if (questionNumber >= 1 && questionNumber <= 15) {
                questionType = '判断题';
            } else if (questionNumber >= 16 && questionNumber <= 35) {
                questionType = '单选题';
            } else if (questionNumber >= 36 && questionNumber <= 50) {
                questionType = '多选题';
            }
        } else {
            // 其他情况，尝试根据选项类型自动判断
            const radioGroup = content.querySelector('.el-radio-group');
            const checkboxGroup = content.querySelector('.el-checkbox-group');
            
            if (radioGroup) {
                questionType = '单选题';
            } else if (checkboxGroup) {
                questionType = '多选题';
            } else {
                questionType = '判断题';
            }
        }

        // 添加题序标题
        const titleText = `${questionNumber}/${totalQuestions} Q ${questionType}`;

        // 提取问题文本
        const questionElement = content.querySelector('.the-exam-page-html');
        const questionText = questionElement ? questionElement.innerText.trim() : '';

        // 提取选项
        const optionsText = extractOptions(content);

        // 组合完整文本
        if (questionText || optionsText) {
            allText += titleText + '\n';
            if (questionText) {
                allText += questionText + '\n';
            }
            if (optionsText) {
                allText += optionsText + '\n';
            }
            allText += '\n'; // 题目间空行
        }
    });

    return allText;
}

function extractOptions(content) {
    let options = [];

    // 检查单选题选项
    const radioGroup = content.querySelector('.el-radio-group');
    if (radioGroup) {
        const radioOptions = radioGroup.querySelectorAll('.el-radio');
        radioOptions.forEach(radio => {
            const text = radio.innerText.trim();
            if (text) {
                options.push(text);
            }
        });
    }

    // 检查多选题选项
    const checkboxGroup = content.querySelector('.el-checkbox-group');
    if (checkboxGroup) {
        const checkboxOptions = checkboxGroup.querySelectorAll('.el-checkbox');
        checkboxOptions.forEach(checkbox => {
            const text = checkbox.innerText.trim();
            if (text) {
                options.push(text);
            }
        });
    }

    return options.join('\n');
}

// 使用示例
const result = extractExamContentWithNumbers();
console.log(result);
const askai = '接下来我在做微认证考试，时间有限，有判断题，单选题和多选题。你需要快速给我答案，减少废话，不需要给过多的解释，直接快速给到答案即可。以下这些题你拿去认真思考，最后给到我每一个题的答案,你的回答应该每一行文本前面带题号，后面是答案，一题占一行文本。多选题多个答案用|隔开。以下是问题和选项：\n';
copyWithGreasemonkey(askai + result);