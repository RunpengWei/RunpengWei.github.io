/*
 * 简历网站交互逻辑
 * 版本切换 + 编辑面板 + 实时预览
 */
(function() {

  var currentVersion = 'academic';
  var resumeData;

  // 安全深拷贝
  function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // 初始化
  function init() {
    // 检查配置是否加载
    if (typeof RESUME_CONFIG === 'undefined') {
      document.getElementById('displayName').textContent = '配置加载失败，请检查 config.js';
      return;
    }

    resumeData = deepCopy(RESUME_CONFIG);
    loadSavedData();
    renderResume();
    populateEditPanel();
    bindEvents();
  }

  // DOM 加载完成后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 事件绑定
  function bindEvents() {
    // 编辑面板开关
    document.getElementById('editToggle').onclick = function() {
      toggleEditPanel();
    };
    document.getElementById('panelClose').onclick = function() {
      closeEditPanel();
    };

    // 版本切换
    document.getElementById('btnAcademic').onclick = function() {
      switchVersion('academic');
    };
    document.getElementById('btnEducation').onclick = function() {
      switchVersion('education');
    };
    document.getElementById('btnCorporate').onclick = function() {
      switchVersion('corporate');
    };

    // 实时编辑
    document.getElementById('editName').oninput = liveUpdate;
    document.getElementById('editTagline').oninput = liveUpdate;
    document.getElementById('editBio').oninput = liveUpdate;
    document.getElementById('editPhone').oninput = liveUpdate;
    document.getElementById('editEmail').oninput = liveUpdate;
    document.getElementById('editSkills').oninput = liveUpdate;

    // 保存重置
    document.getElementById('saveBtn').onclick = function() { saveData(); };
    document.getElementById('resetBtn').onclick = function() { resetData(); };

    // 添加教育
    document.getElementById('addEducation').onclick = function() { addEducationEntry(); };
  }

  // 版本切换
  function switchVersion(version) {
    currentVersion = version;

    // 更新按钮
    var btns = document.querySelectorAll('.version-btn');
    for (var i = 0; i < btns.length; i++) {
      var v = btns[i].getAttribute('data-version');
      if (v === version) {
        btns[i].className = 'version-btn active';
      } else {
        btns[i].className = 'version-btn';
      }
    }

    // 主题
    document.body.className = '';
    if (version === 'education') document.body.className = 'theme-education';
    if (version === 'corporate') document.body.className = 'theme-corporate';

    renderResume();
    populateEditPanel();
  }

  // 渲染简历内容
  function renderResume() {
    var shared = resumeData.shared;
    var ver = resumeData[currentVersion];

    // 头部
    document.getElementById('displayName').textContent = shared.name;
    document.getElementById('displayTagline').textContent = ver.tagline;
    document.getElementById('displayBio').textContent = ver.bio;
    document.getElementById('navName').textContent = shared.name;

    // 联系方式
    var contactHtml = '<span class="contact-item">Tel: ' + shared.phone + '</span>';
    contactHtml += '<span class="contact-item">Email: ' + shared.email + '</span>';
    document.getElementById('displayContact').innerHTML = contactHtml;

    // 教育背景
    var eduHtml = '';
    for (var i = 0; i < shared.education.length; i++) {
      var edu = shared.education[i];
      eduHtml += '<div class="edu-item">';
      eduHtml += '<div class="edu-header"><div>';
      eduHtml += '<div class="edu-school">' + edu.school + ' · ' + edu.degree + '</div>';
      eduHtml += '<div class="edu-major">' + edu.major + '</div>';
      eduHtml += '</div>';
      eduHtml += '<span class="edu-time">' + edu.time + '</span></div>';
      eduHtml += '<ul class="edu-details">';
      for (var j = 0; j < edu.details.length; j++) {
        eduHtml += '<li>' + edu.details[j] + '</li>';
      }
      eduHtml += '</ul></div>';
    }
    document.getElementById('displayEducation').innerHTML = eduHtml;

    // 荣誉
    var honorsHtml = '';
    for (var i = 0; i < shared.honors.length; i++) {
      honorsHtml += '<div class="honor-item">' + shared.honors[i] + '</div>';
    }
    document.getElementById('displayHonors').innerHTML = honorsHtml;

    // 动态区块
    var secHtml = '';
    for (var s = 0; s < ver.sections.length; s++) {
      var sec = ver.sections[s];
      secHtml += '<section class="resume-section">';
      secHtml += '<h2 class="section-title"><span class="section-icon">' + sec.icon + '</span> ' + sec.title + '</h2>';
      secHtml += '<div class="section-content">';
      for (var k = 0; k < sec.items.length; k++) {
        var item = sec.items[k];
        secHtml += '<div class="exp-item">';
        secHtml += '<div class="exp-header">';
        secHtml += '<span class="exp-role">' + item.role + '</span>';
        if (item.time) {
          secHtml += '<span class="exp-time">' + item.time + '</span>';
        }
        secHtml += '</div>';
        if (item.org) {
          secHtml += '<div class="exp-org">' + item.org + '</div>';
        }
        secHtml += '<ul class="exp-details">';
        for (var d = 0; d < item.details.length; d++) {
          secHtml += '<li>' + item.details[d] + '</li>';
        }
        secHtml += '</ul></div>';
      }
      secHtml += '</div></section>';
    }
    document.getElementById('dynamicSections').innerHTML = secHtml;

    // 技能
    var skillHtml = '';
    for (var i = 0; i < shared.skills.length; i++) {
      skillHtml += '<span class="skill-tag">' + shared.skills[i] + '</span>';
    }
    document.getElementById('displaySkills').innerHTML = skillHtml;
  }

  // 填充编辑面板
  function populateEditPanel() {
    var shared = resumeData.shared;
    var ver = resumeData[currentVersion];
    document.getElementById('editName').value = shared.name;
    document.getElementById('editTagline').value = ver.tagline;
    document.getElementById('editBio').value = ver.bio;
    document.getElementById('editPhone').value = shared.phone;
    document.getElementById('editEmail').value = shared.email;
    document.getElementById('editSkills').value = shared.skills.join(', ');
    renderEducationInputs();
  }

  // 渲染教育输入框
  function renderEducationInputs() {
    var container = document.getElementById('editEducation');
    container.innerHTML = '';
    for (var i = 0; i < resumeData.shared.education.length; i++) {
      var edu = resumeData.shared.education[i];
      var div = document.createElement('div');
      div.className = 'edu-input-group';

      var inp1 = document.createElement('input');
      inp1.type = 'text';
      inp1.value = edu.school;
      inp1.placeholder = '学校';
      inp1.setAttribute('data-idx', i);
      inp1.setAttribute('data-field', 'school');
      inp1.oninput = eduInputChange;

      var inp2 = document.createElement('input');
      inp2.type = 'text';
      inp2.value = edu.major;
      inp2.placeholder = '专业';
      inp2.setAttribute('data-idx', i);
      inp2.setAttribute('data-field', 'major');
      inp2.oninput = eduInputChange;

      var inp3 = document.createElement('input');
      inp3.type = 'text';
      inp3.value = edu.time;
      inp3.placeholder = '时间段';
      inp3.setAttribute('data-idx', i);
      inp3.setAttribute('data-field', 'time');
      inp3.oninput = eduInputChange;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'remove-edu-btn';
      btn.textContent = '删除';
      btn.setAttribute('data-idx', i);
      btn.onclick = removeEdu;

      div.appendChild(inp1);
      div.appendChild(inp2);
      div.appendChild(inp3);
      div.appendChild(btn);
      container.appendChild(div);
    }
  }

  function eduInputChange(e) {
    var idx = parseInt(e.target.getAttribute('data-idx'));
    var field = e.target.getAttribute('data-field');
    resumeData.shared.education[idx][field] = e.target.value;
    renderResume();
  }

  function removeEdu(e) {
    var idx = parseInt(e.target.getAttribute('data-idx'));
    resumeData.shared.education.splice(idx, 1);
    renderEducationInputs();
    renderResume();
  }

  function addEducationEntry() {
    resumeData.shared.education.push({
      school: '',
      degree: '',
      major: '',
      time: '',
      details: []
    });
    renderEducationInputs();
  }

  // 实时更新
  function liveUpdate() {
    var shared = resumeData.shared;
    var ver = resumeData[currentVersion];
    shared.name = document.getElementById('editName').value;
    ver.tagline = document.getElementById('editTagline').value;
    ver.bio = document.getElementById('editBio').value;
    shared.phone = document.getElementById('editPhone').value;
    shared.email = document.getElementById('editEmail').value;

    var skillStr = document.getElementById('editSkills').value;
    var arr = skillStr.split(/[,，]/);
    var result = [];
    for (var i = 0; i < arr.length; i++) {
      var s = arr[i].replace(/^\s+|\s+$/g, '');
      if (s.length > 0) result.push(s);
    }
    shared.skills = result;

    renderResume();
  }

  // 面板控制
  function toggleEditPanel() {
    var panel = document.getElementById('editPanel');
    var btn = document.getElementById('editToggle');
    if (panel.className.indexOf('visible') >= 0) {
      panel.className = 'edit-panel';
      btn.className = 'edit-toggle-btn';
    } else {
      panel.className = 'edit-panel visible';
      btn.className = 'edit-toggle-btn active';
    }
  }

  function closeEditPanel() {
    document.getElementById('editPanel').className = 'edit-panel';
    document.getElementById('editToggle').className = 'edit-toggle-btn';
  }

  // 保存
  function saveData() {
    try {
      localStorage.setItem('resume_data_v3', JSON.stringify(resumeData));
      localStorage.setItem('resume_version_v3', currentVersion);
    } catch(e) {}
    showToast('保存成功！');
  }

  function loadSavedData() {
    try {
      var saved = localStorage.getItem('resume_data_v3');
      var ver = localStorage.getItem('resume_version_v3');
      if (saved) {
        resumeData = JSON.parse(saved);
      }
      if (ver) {
        currentVersion = ver;
        if (ver === 'education') document.body.className = 'theme-education';
        if (ver === 'corporate') document.body.className = 'theme-corporate';
        var btns = document.querySelectorAll('.version-btn');
        for (var i = 0; i < btns.length; i++) {
          var v = btns[i].getAttribute('data-version');
          if (v === currentVersion) {
            btns[i].className = 'version-btn active';
          } else {
            btns[i].className = 'version-btn';
          }
        }
      }
    } catch(e) {}
  }

  function resetData() {
    if (!confirm('确定重置所有修改？')) return;
    resumeData = deepCopy(RESUME_CONFIG);
    try {
      localStorage.removeItem('resume_data_v3');
      localStorage.removeItem('resume_version_v3');
    } catch(e) {}
    renderResume();
    populateEditPanel();
    showToast('已重置');
  }

  // Toast
  function showToast(msg) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function() {
      t.style.opacity = '0';
      t.style.transition = 'opacity 0.3s';
      setTimeout(function() {
        if (t.parentNode) t.parentNode.removeChild(t);
      }, 300);
    }, 2000);
  }

})();
