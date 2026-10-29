require "rails_helper"

RSpec.describe QuizConversion do
  let(:fixtures) { Rails.root.join("spec/fixtures/files/quizzes") }

  describe QuizDocument do
    subject(:document) { QuizDocument.new(fixtures.join("valid/PT_module_1.docx")) }

    it "reads the first paragraph as the title" do
      expect(document.title).to eq("Teste de admissão")
    end

    it "reads list-numbered, hand-numbered and sub-level questions, and options that start in a list of their own" do
      expect(document.questions.map(&:text)).to eq([
        "Quantos serviços existem?",
        "A chuva condiciona a resposta por:",
        "O serviço é por baixo:"
      ])
      expect(document.questions.map(&:options)).to eq([
        [ "Um", "“Dois”", "Três" ],
        [ "Ressalto mais baixo", "Bola mais pesada", "Todas as respostas anteriores" ],
        %w[Verdadeira Falsa]
      ])
    end

    it "takes the bold option as correct, ignoring unbolded quotes and hand lettering around it" do
      expect(document.questions.map(&:correct_index)).to eq([ 1, 2, 1 ])
    end
  end

  it "maps mesocycles to Module slugs, leaving Coaching Tools unassigned" do
    expect([ 1, 7, 8, 9, 15 ].map { |n| described_class.slug_for(n) })
      .to eq(%w[module-1 module-7 unassigned/coaching-tools module-8 module-14])
  end

  it "pairs the PT and ENG documents into one Quiz with a shared correct index" do
    conversion = described_class.new(fixtures.join("valid"))

    expect(conversion.run).to be(true)
    quiz = conversion.quizzes.fetch("module-1")
    expect(quiz[:title]).to eq("en-US" => "Admission test", "pt" => "Teste de admissão")
    expect(quiz[:questions].first).to eq(
      question: { "en-US" => "How many services are there?", "pt" => "Quantos serviços existem?" },
      answers: { "en-US" => [ "One", "“Two”", "Three" ], "pt" => [ "Um", "“Dois”", "Três" ] },
      correctIndex: 1
    )
  end

  it "refuses a pair that marks different correct options, and lists it" do
    conversion = described_class.new(fixtures.join("mismatch"))

    expect(conversion.run).to be(false)
    expect(conversion.errors).to eq([ "Mesocycle 9: question 3: PT marks option B, ENG marks A" ])
  end

  it "writes JSON and PT and EN review markdown per Module" do
    conversion = described_class.new(fixtures.join("valid"))
    conversion.run

    Dir.mktmpdir do |dir|
      conversion.write(dir)

      expect(JSON.parse(File.read("#{dir}/module-1.json"))["questions"].size).to eq(3)
      expect(File.read("#{dir}/module-1.pt.md")).to include("## Questão 3", "- B) Falsa", "**Resposta Correta: B**")
      expect(File.read("#{dir}/module-1.en.md")).to include("## Question 1", "**Correct Answer: B**")
    end
  end
end
