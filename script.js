const SUPABASE_URL = 'https://noawhiwgihrcqygsmjed.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vYXdoaXdnaWhyY3F5Z3NtamVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxOTkzMzUsImV4cCI6MjA4NDc3NTMzNX0.MPeLwmSh5Vx12J470W_tbojh5JoUJIhSa0V-Q_a20ow';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. Завантаження тем
async function loadContent() {
    const container = document.getElementById('main-container');
    container.innerHTML = '<p style="text-align:center; color: var(--text-muted);">Завантаження дискусій...</p>';

    const { data: topics, error: tError } = await supabaseClient
        .from('topics')
        .select('*')
        .eq('status', 'active')
        .order('id', { ascending: true });

    if (tError) {
        console.error('Помилка тем:', tError);
        container.innerHTML = '<p style="text-align:center; color: var(--contra);">Помилка завантаження.</p>';
        return;
    }

    container.innerHTML = ''; 

    for (const topic of topics) {
        const topicBlock = document.createElement('div');
        topicBlock.className = 'topic-block';
        topicBlock.style.marginBottom = '4rem'; 

        topicBlock.innerHTML = `
            <div class="topic-header">
                <span style="color: var(--accent); font-weight: bold;">Тема #${topic.id} | ${topic.category || 'Загальне'}</span>
                <h2 style="margin: 10px 0;">${topic.title}</h2>
                <p style="color: var(--text-muted);">${topic.description}</p>
            </div>
            <div class="debate-grid" id="grid-${topic.id}"></div>
            <button class="btn-action" onclick="addIdea(${topic.id})">
                + Додати свій внесок у дискусію
            </button>
        `;
        
        container.appendChild(topicBlock);
        await loadArguments(topic.id);
    }
}

// 2. Завантаження аргументів
async function loadArguments(topicId) {
    const { data: args, error } = await supabaseClient
        .from('arguments')
        .select('*')
        .eq('topic_id', topicId)
        .order('reputation', { ascending: false });

    const grid = document.getElementById(`grid-${topicId}`);
    
    if (args && grid) {
        grid.innerHTML = '';
        args.forEach(arg => {
            const typeClass = arg.arg_type === 'con' || arg.arg_type === 'contra' ? 'contra' : 'pro';
            
            const card = `
                <div class="argument-card ${typeClass}">
                    <div style="display:flex; justify-content:space-between; align-items: center; margin-bottom: 15px;">
                        <span class="badge badge-${typeClass}">${arg.badge_text || 'Думка'}</span>
                        <span style="cursor:pointer; background: rgba(255,255,255,0.05); padding: 5px 10px; border-radius: 20px;" onclick="voteArgument(${arg.id}, ${topicId})">
                            👍 <b>${arg.reputation}</b>
                        </span>
                    </div>
                    <h3 style="margin: 0 0 10px 0; color: var(--accent);">${arg.title || 'Нова ідея'}</h3>
                    <p style="font-size: 0.95rem; margin-bottom: 15px;">${arg.content}</p>
                    <small style="color: var(--text-muted); font-style: italic;">— ${arg.author_name}</small>
                </div>
            `;
            grid.innerHTML += card;
        });
    }
}

// 3. Голосування
async function voteArgument(argId, topicId) {
    const { data, error } = await supabaseClient
        .rpc('vote_for_argument', { arg_id: argId });

    if (error) {
        alert("Помилка: " + error.message);
    } else {
        loadArguments(topicId);
    }
}

// 4. Додавання ідеї (з типом pro/contra)
async function addIdea(topicId) {
    const authorName = prompt("Введіть ваше ім'я:", "Гість");
    if (authorName === null) return;

    const title = prompt("Заголовок вашої думки:", "Гіпотеза");
    if (title === null) return;

    const badgeText = prompt("Ваш статус (наприклад: Студент, Дослідник):", "Учасник");
    if (badgeText === null) return;

    const text = prompt("Опишіть вашу ідею:");
    if (!text) return;

    const typeInput = prompt("Тип аргументу (введіть 'pro' для підтримки або 'contra' для заперечення):", "pro");
    const safeType = (typeInput === 'contra' || typeInput === 'con') ? 'contra' : 'pro';

    const { data, error } = await supabaseClient
        .from('arguments')
        .insert([
            { 
                topic_id: topicId, 
                content: text, 
                arg_type: safeType,
                title: title, 
                badge_text: badgeText,
                author_name: authorName
            }
        ]);

    if (error) {
        alert("Не вдалося зберегти: " + error.message);
    } else {
        alert("Успішно додано!");
        loadArguments(topicId); 
    }
}

loadContent();
