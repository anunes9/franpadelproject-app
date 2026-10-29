require "open3"

# One of the academy's quiz Word documents (PT_module_<n>.docx or
# ENG_module_<n>.docx), read into its title and questions.
#
# The first paragraph is the title. After it, each question is a paragraph on
# its own, followed by its options: a run of paragraphs sharing a list and
# level. The documents were edited by hand, so the questions are not always one
# list (it restarts partway through some), the options are sometimes a sub-level
# of the question list or start in a list of their own, and some questions and
# options are numbered by hand ("XV. ...", "a) ..."). The correct option is the
# one written in bold.
class QuizDocument
  Question = Struct.new(:text, :options, :bold, keyword_init: true) do
    # The index of the bold option, or nil unless exactly one option is bold.
    def correct_index
      bold.count(true) == 1 ? bold.index(true) : nil
    end
  end

  NS = { "w" => "http://schemas.openxmlformats.org/wordprocessingml/2006/main" }.freeze
  HAND_NUMBERED_QUESTION = /\A[IVXLC]+\.\s+/
  HAND_LETTERED_OPTION = /\A[a-z]\)\s*/
  LIST_PUNCTUATION = /\s*[;.]\z/

  attr_reader :path, :title, :questions

  def initialize(path)
    @path = path.to_s
    parse(Nokogiri::XML(document_xml))
  end

  private

  def document_xml
    xml, status = Open3.capture2("unzip", "-p", path, "word/document.xml")
    raise ArgumentError, "#{path} is not a Word document" unless status.success? && xml.present?

    xml
  end

  def parse(doc)
    paragraphs = doc.xpath("//w:body/w:p", NS).filter_map { |p| paragraph(p) }
    @title = paragraphs.shift&.fetch(:text)
    @questions = []

    paragraphs.each_with_index do |p, i|
      if question?(p, paragraphs[i - 1], paragraphs[i + 1], i)
        @questions << Question.new(text: p[:text].sub(HAND_NUMBERED_QUESTION, ""), options: [], bold: [])
      elsif (question = @questions.last)
        question.options << p[:text].sub(HAND_LETTERED_OPTION, "").sub(LIST_PUNCTUATION, "")
        question.bold << p[:bold]
      end
    end
  end

  # A paragraph on its own is a question, unless it comes straight after a
  # question that has no options yet: then it is a first option that was put
  # in a list of its own.
  def question?(paragraph, before, after, index)
    return true if paragraph[:key] == :hand_question
    return false if paragraph[:key] == :hand_option
    return false if @questions.last&.options&.empty?

    (index.zero? || before[:key] != paragraph[:key]) && after&.fetch(:key) != paragraph[:key]
  end

  def paragraph(node)
    runs = node.xpath(".//w:r", NS).map { |r| [ run_text(r), bold?(r) ] }
    text = squish(runs.sum("") { |t, _| t })
    return if text.empty?

    { text: text, key: key(node, text), bold: mostly_bold?(runs) }
  end

  def key(node, text)
    return :hand_question if text.match?(HAND_NUMBERED_QUESTION)
    return :hand_option if text.match?(HAND_LETTERED_OPTION)

    list = node.at_xpath("w:pPr/w:numPr/w:numId/@w:val", NS)&.value
    level = node.at_xpath("w:pPr/w:numPr/w:ilvl/@w:val", NS)&.value
    list ? [ list, level ] : :unnumbered
  end

  # Bold by letters and digits, so an unbolded "d) " or quote around a bold
  # answer still counts as bold.
  def mostly_bold?(runs)
    counts = runs.each_with_object(Hash.new(0)) { |(t, b), c| c[b] += t.scan(/[[:alnum:]]/).size }
    counts[true] > counts[false]
  end

  def run_text(run)
    run.xpath("w:t|w:tab|w:br", NS).sum("") { |n| n.name == "t" ? n.text : " " }
  end

  def bold?(run)
    b = run.at_xpath("w:rPr/w:b", NS)
    b.present? && %w[1 true on].include?(b.attribute_with_ns("val", NS["w"])&.value || "1")
  end

  def squish(text)
    text.gsub(/[[:space:]]+/, " ").strip
  end
end
